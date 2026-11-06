// Beitrag aus dem Momentwerk-Export "Für Website (ZIP)" als Neuigkeit übernehmen.
// Aufruf:  npm run blog-import -- <datei.zip> [--force]
// Ohne --force nur Trockenlauf: prüft die ZIP und zeigt, was geschrieben würde.
// Schreibt src/content/news/<slug>.md und die Bilder nach src/assets/images/news/<slug>/ (JPG, Metadaten entfernt).
// Gleiche momentwerkId = derselbe Beitrag: Eintrag und Bilder werden ersetzt, kein Duplikat.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { importImage } from './lib/image.mjs';
import { readZip, parseBeitrag, validate, buildEntry, slugify } from './lib/blog-import.mjs';
import { parseFrontmatter } from './lib/checks.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const force = args.includes('--force');
const zipPath = args.find((a) => !a.startsWith('--'));
const fail = (msg) => { console.error(msg); process.exit(1); };

if (!zipPath) fail('Aufruf: npm run blog-import -- <datei.zip> [--force]');
if (!existsSync(zipPath)) fail(`ZIP nicht gefunden: ${zipPath}`);

const files = readZip(readFileSync(zipPath));
if (!files.has('beitrag.md')) fail('beitrag.md fehlt in der ZIP');
const parsed = parseBeitrag(Buffer.from(files.get('beitrag.md')).toString('utf8'));
const errors = validate(parsed, files);
if (errors.length) { console.error('Die ZIP entspricht nicht dem Format momentwerk-1:'); errors.forEach((e) => console.error('  FEHLER: ' + e)); process.exit(1); }

// Gleiche momentwerkId vorhanden? Dann deren Slug weiterverwenden.
const newsDir = join(root, 'src', 'content', 'news');
mkdirSync(newsDir, { recursive: true });
const id = String(parsed.meta.id);
let slug = slugify(String(parsed.meta.date instanceof Date ? parsed.meta.date.toISOString().slice(0, 10) : parsed.meta.date), parsed.meta.title);
let replacing = false;
let oldData = null;
for (const f of readdirSync(newsDir).filter((x) => x.endsWith('.md'))) {
  const other = parseFrontmatter(readFileSync(join(newsDir, f), 'utf8'));
  if (other.momentwerkId !== undefined && String(other.momentwerkId) === id) { slug = f.replace(/\.md$/, ''); replacing = true; oldData = other; }
}
if (!replacing && existsSync(join(newsDir, slug + '.md'))) fail(`Es gibt schon eine Neuigkeit "${slug}" mit anderer momentwerkId. Bitte von Hand klären.`);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`Slug "${slug}" ist ungültig`);

const imgRoot = join(root, 'src', 'assets', 'images', 'news');
const imgDir = join(imgRoot, slug);
if (relative(imgRoot, imgDir).startsWith('..') || relative(imgRoot, imgDir).split(sep).length !== 1) fail('Bildordner liegt außerhalb von news/');
// Quellbilder liegen als AVIF im Repo (Qualität 50, 1200 px): gleiche Bildqualität nach dem Bauen, rund 45 % kleiner als JPG.
const target = (file) => `${file === 'bilder/cover.webp' ? 'cover' : file.match(/(\d{2})\.webp$/)[1]}.avif`;
const entry = buildEntry(parsed, (file) => `../../assets/images/news/${slug}/${target(file)}`);

// Erneuter Import: von Hand ergänzte Alt-Texte bleiben erhalten, wo Momentwerk keinen eigenen liefert (Platzhalter).
let keptAlts = 0;
if (oldData) {
  const base = (p) => String(p).split('/').pop().replace(/\.[a-z]+$/, '');
  const old = new Map((oldData.sections || []).flatMap((s) => (s.photos || []).map((p) => [base(p.image), p.alt])));
  const placeholders = new Set(entry.fallbackAlts.map((f) => base(target(f))));
  for (const s of entry.data.sections) for (const p of s.photos || []) {
    const b = base(p.image);
    if (placeholders.has(b) && old.get(b) && old.get(b) !== p.alt) { p.alt = old.get(b); placeholders.delete(b); keptAlts += 1; }
  }
  if (oldData.coverAlt && !/^Titelbild: /.test(oldData.coverAlt)) { entry.data.coverAlt = oldData.coverAlt; keptAlts += 1; }
  entry.fallbackAlts = entry.fallbackAlts.filter((f) => placeholders.has(base(target(f))));
}

console.log(`${replacing ? 'Ersetzt' : 'Neu'}: ${slug}  (momentwerkId ${id}, ${files.size - 1} Bilder, ${parsed.sections.length} Abschnitte)`);
if (!force) {
  console.log('Trockenlauf: nichts geschrieben. Mit --force übernehmen.');
  process.exit(0);
}

// Bilder direkt aus dem Speicher umwandeln (sharp nimmt Buffer), die ZIP-Datei bleibt unverändert.
if (existsSync(imgDir)) rmSync(imgDir, { recursive: true, force: true });
mkdirSync(imgDir, { recursive: true });
let gps = 0, kept = 0;
for (const [name, data] of files) {
  if (name === 'beitrag.md') continue;
  const r = await importImage(Buffer.from(data), join(imgDir, target(name)), { max: 1200, quality: 50 }); // Fotos erscheinen höchstens 640 px breit, das reicht auch für Retina
  if (r.hadGps) gps += 1;
  if (r.keptExif) kept += 1;
}
if (gps) console.log(`  Hinweis: ${gps} Bild(er) enthielten GPS-Koordinaten, im Ergebnis entfernt.`);
if (kept) console.log(`  Warnung: ${kept} Bild(er) enthalten noch Metadaten, bitte prüfen.`);

const md = `---\n${stringify(entry.data, { lineWidth: 0 }).trimEnd()}\n---\n${entry.body}\n`;
writeFileSync(join(newsDir, slug + '.md'), md, 'utf8');
console.log(`Geschrieben: src/content/news/${slug}.md und src/assets/images/news/${slug}/`);
if (keptAlts) console.log(`  ${keptAlts} von Hand ergänzte Alt-Texte aus dem bisherigen Eintrag übernommen. Textänderungen im Beitrag gehen beim erneuten Import verloren.`);
const rest = entry.fallbackAlts.length + (/^Titelbild: /.test(entry.data.coverAlt) ? 1 : 0);
if (rest) console.log(`  Hinweis: ${rest} Alt-Text(e) sind Platzhalter. Bitte in der Datei durch eine Beschreibung des Bildinhalts ersetzen.`);
console.log('Nächster Schritt: npm run check');

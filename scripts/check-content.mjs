// Prüft die Inhalte vor dem Build: Slugs, Dateien, Bilder (Größe, Breite, GPS), Verweise, GPX-Länge. Start: npm run check:content
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { checkEntries, parseFrontmatter, gpxLengthKm } from './lib/checks.mjs';
import { exifHasGps } from './lib/exif.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const collections = ['tours', 'videos', 'stories', 'events', 'projects', 'news', 'pages'];
const data = {};
const readErrors = [];

for (const c of collections) {
  data[c] = {};
  const dir = join(root, 'src', 'content', c);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    try {
      data[c][f.replace(/\.md$/, '')] = parseFrontmatter(readFileSync(join(dir, f), 'utf8'));
    } catch (e) {
      readErrors.push(`${c}/${f}: ${e.message}`);
    }
  }
}

// Bildpfade in den Einträgen sind relativ zur Markdown-Datei (src/content/<typ>/), z. B. ../../assets/images/tours/x.jpg
const imageBase = join(root, 'src', 'content', 'tours');
const imageCache = new Map();
const imgFields = ['image', 'thumbnail', 'cover'];
const referenced = new Set();
for (const c of collections) for (const e of Object.values(data[c])) {
  for (const f of imgFields) if (typeof e[f] === 'string') referenced.add(resolve(imageBase, e[f]));
  for (const s of Array.isArray(e.sections) ? e.sections : []) for (const p of Array.isArray(s?.photos) ? s.photos : []) if (typeof p?.image === 'string') referenced.add(resolve(imageBase, p.image));
  for (const p of Array.isArray(e.photos) ? e.photos : []) if (typeof p?.image === 'string') referenced.add(resolve(imageBase, p.image));
}
// Bilder im Fließtext (![Alt](Pfad)): zählen als verwendet und werden wie die Titelbilder geprüft
const bodyImages = [];
for (const c of collections) {
  const dir = join(root, 'src', 'content', c);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    for (const m of readFileSync(join(dir, f), 'utf8').matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const p = resolve(imageBase, m[1]);
      referenced.add(p);
      bodyImages.push({ where: c + '/' + f, rel: m[1] });
    }
  }
}
const infos = new Map();
for (const p of referenced) {
  if (!existsSync(p)) { infos.set(p, null); continue; }
  const m = await sharp(p).metadata();
  infos.set(p, { bytes: statSync(p).size, width: m.width, height: m.height, gps: exifHasGps(m.exif) });
}

const io = {
  exists: (rel) => existsSync(join(root, 'public', rel)),
  gpxKm: (rel) => gpxLengthKm(readFileSync(join(root, 'public', rel), 'utf8')),
  image: (rel) => infos.get(resolve(imageBase, rel)) ?? null,
};
const { errors, warnings } = checkEntries(data, io);
for (const { where, rel } of bodyImages) {
  const i = io.image(rel);
  if (!i) errors.push(where + ": Bild im Text fehlt (" + rel + ")");
  else if (i.gps) errors.push(where + ": Bild im Text enthält GPS-Koordinaten (" + rel + ")");
}
errors.unshift(...readErrors);

// Pfadwerk-Monatscodes: der laufende Monat muss einen Code haben, ab dem 20. auch der nächste (Hinweis, kein Fehler)
const { PREMIUM_CODES } = await import(pathToFileURL(join(root, 'src', 'data', 'premium-codes.js')).href);
{
  const now = new Date();
  const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  if (!PREMIUM_CODES[key(now)]) warnings.push('Pfadwerk: für den laufenden Monat (' + key(now) + ') fehlt der Freischalt-Code in src/data/premium-codes.js');
  else if (now.getDate() >= 20 && !PREMIUM_CODES[key(next)]) warnings.push('Pfadwerk: für ' + key(next) + ' fehlt noch der Freischalt-Code (src/data/premium-codes.js, wird am 25. ergänzt)');
}

// Originale, die kein Eintrag verwendet (Hinweis, kein Fehler)
const assets = join(root, 'src', 'assets', 'images');
(function walk(d) {
  if (!existsSync(d)) return;
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (!referenced.has(resolve(p))) warnings.push(`Bild wird von keinem Eintrag verwendet: ${relative(root, p).replace(/\\/g, '/')}`);
  }
})(assets);

const n = Object.fromEntries(collections.map((c) => [c, Object.keys(data[c]).length]));
console.log(`Inhalte geprüft: ${Object.entries(n).map(([c, k]) => `${k} ${c}`).join(', ')}, ${referenced.size} Bilder`);
for (const w of warnings) console.log(`  Hinweis: ${w}`);
for (const e of errors) console.error(`  FEHLER: ${e}`);
if (errors.length) {
  console.error(`\n${errors.length} Fehler in den Inhalten.`);
  process.exit(1);
}
console.log('Inhalte: alles in Ordnung.');

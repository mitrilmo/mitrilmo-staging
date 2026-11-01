// Prüft die Inhalte vor dem Build: Slugs, Dateien, Bilder (Größe, Breite, GPS), Verweise, GPX-Länge. Start: npm run check:content
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { checkEntries, parseFrontmatter, gpxLengthKm } from './lib/checks.mjs';
import { exifHasGps } from './lib/exif.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const collections = ['tours', 'videos', 'stories', 'events', 'projects', 'news'];
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
  for (const p of Array.isArray(e.photos) ? e.photos : []) if (typeof p?.image === 'string') referenced.add(resolve(imageBase, p.image));
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
errors.unshift(...readErrors);

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

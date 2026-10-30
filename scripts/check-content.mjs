// Prüft die Inhalte vor dem Build: Slugs, Dateien, Referenzen, GPX-Länge. Start: npm run check:content
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { checkEntries, parseFrontmatter, gpxLengthKm } from './lib/checks.mjs';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const collections = ['tours', 'videos', 'stories', 'events', 'projects'];
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

const io = {
  exists: (rel) => existsSync(join(root, 'public', rel)),
  gpxKm: (rel) => gpxLengthKm(readFileSync(join(root, 'public', rel), 'utf8')),
};
const { errors, warnings } = checkEntries(data, io);
errors.unshift(...readErrors);

const n = Object.fromEntries(collections.map((c) => [c, Object.keys(data[c]).length]));
console.log(`Inhalte geprüft: ${Object.entries(n).map(([c, k]) => `${k} ${c}`).join(', ')}`);
for (const w of warnings) console.log(`  Hinweis: ${w}`);
for (const e of errors) console.error(`  FEHLER: ${e}`);
if (errors.length) {
  console.error(`\n${errors.length} Fehler in den Inhalten.`);
  process.exit(1);
}
console.log('Inhalte: alles in Ordnung.');

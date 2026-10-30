// Prüft die gebaute Seite (dist/): Metadaten, Umami, Fremdanfragen, tote Links, Lizenztext der Schrift.
// Start nach dem Build: npm run check:dist   (Live-Build: STAGING=false npm run check:dist)
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { checkHtml, checkLinks, checkLegal } from './lib/checks.mjs';

// Seiten, auf die schon verlinkt wird, die aber erst migriert werden (Umsetzungsplan). Eintrag entfernen, sobald die Seite existiert.
const PENDING = { 'pfadwerk.html': 'AP2.5 (Datenschutztext verlinkt darauf)' };

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const dist = join(root, 'dist');
if (!existsSync(dist)) {
  console.error('dist/ fehlt, bitte zuerst npm run build ausführen.');
  process.exit(1);
}
const staging = process.env.STAGING !== 'false';
const base = staging ? '/mitrilmo-staging' : '';

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : files.push(relative(dist, p).replace(/\\/g, '/'));
  }
})(dist);

const pages = new Map(files.filter((f) => f.endsWith('.html')).map((f) => [f, readFileSync(join(dist, f), 'utf8')]));
const problems = [];

for (const [page, html] of pages) for (const p of checkHtml(html, { staging })) problems.push(`${page}: ${p}`);
const set = new Set(files);
const pending = new Set();
problems.push(...checkLinks(pages, base, (rel) => {
  if (set.has(rel)) return true;
  if (PENDING[rel]) { pending.add(rel); return true; }
  return false;
}));
problems.push(...checkLegal(pages));
for (const rel of pending) console.log(`  Hinweis: Link auf ${rel} noch ohne Seite, geplant in ${PENDING[rel]}`);
for (const rel of Object.keys(PENDING)) if (set.has(rel)) problems.push(`${rel} existiert jetzt, bitte aus PENDING in scripts/check-dist.mjs entfernen`);

for (const req of ['index.html', '404.html']) if (!set.has(req)) problems.push(`${req} fehlt im Build`);
if (files.some((f) => f.endsWith('.woff2')) && !files.some((f) => /^fonts\/OFL.*\.txt$/.test(f))) {
  problems.push('Schriftdateien ohne Lizenztext (fonts/OFL-*.txt) im Build');
}

console.log(`Gebaute Seite geprüft: ${pages.size} Seiten, ${files.length} Dateien (${staging ? 'Staging' : 'Live'}).`);
for (const p of problems) console.error(`  FEHLER: ${p}`);
if (problems.length) {
  console.error(`\n${problems.length} Fehler in der gebauten Seite.`);
  process.exit(1);
}
console.log('Gebaute Seite: alles in Ordnung.');

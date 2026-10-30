// Prüft die gebaute Seite (dist/): Metadaten, Umami, Fremdanfragen, tote Links, Lizenztext der Schrift.
// Start nach dem Build: npm run check:dist   (Live-Build: STAGING=false npm run check:dist)
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { checkHtml, checkLinks } from './lib/checks.mjs';

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
problems.push(...checkLinks(pages, base, (rel) => set.has(rel)));

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

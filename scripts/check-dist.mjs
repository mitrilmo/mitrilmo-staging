// Prüft die gebaute Seite (dist/): Metadaten, Umami, Fremdanfragen (HTML und CSS), tote Links, Bilder, Lizenztext der Schrift.
// Staging:  npm run check:dist        Live:  npm run check:live   (oder: node scripts/check-dist.mjs --live)
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkHtml, checkLinks, checkLegal, checkDistImages, checkCss, checkRobots, checkSitemap } from './lib/checks.mjs';

// Seiten, auf die schon verlinkt wird, die aber erst migriert werden (Umsetzungsplan). Nur im Staging erlaubt,
// beim Live-Build ist ein Link ohne Seite ein Fehler. Eintrag entfernen, sobald die Seite existiert.
const PENDING = {};
const SITE_LIMIT_MB = 500;

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
if (!existsSync(dist)) {
  console.error('dist/ fehlt, bitte zuerst bauen (npm run build bzw. npm run build:live).');
  process.exit(1);
}
const live = process.argv.includes('--live') || process.env.STAGING === 'false';
const staging = !live;
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
for (const f of files.filter((x) => x.endsWith('.css'))) problems.push(...checkCss(readFileSync(join(dist, f), 'utf8'), f));

const set = new Set(files);
const pending = new Set();
problems.push(...checkLinks(pages, base, (rel) => {
  if (set.has(rel)) return true;
  if (staging && PENDING[rel]) { pending.add(rel); return true; }
  return false;
}));
problems.push(...checkLegal(pages));
problems.push(...checkDistImages(files.map((f) => ({ path: f, bytes: statSync(join(dist, f)).size }))));
if (set.has('robots.txt')) problems.push(...checkRobots(readFileSync(join(dist, 'robots.txt'), 'utf8'), staging));
if (live) {
  const read = (f) => (set.has(f) ? readFileSync(join(dist, f), 'utf8') : '');
  problems.push(...checkSitemap(read('sitemap.xml'), read('robots.txt'), [...pages.keys()], 'https://www.mitrilmo.com'));
}

for (const rel of pending) console.log(`  Hinweis: Link auf ${rel} noch ohne Seite, geplant in ${PENDING[rel]}`);
for (const rel of Object.keys(PENDING)) if (set.has(rel)) problems.push(`${rel} existiert jetzt, bitte aus PENDING in scripts/check-dist.mjs entfernen`);
// Entwicklungsseiten (dev-*.html) gibt es nur im Staging, sie dürfen nie live gehen
if (live) for (const f of files.filter((x) => /(^|\/)dev-[^/]*\.html$/.test(x))) problems.push(`Entwicklungsseite ${f} darf nicht live gehen`);
if (live && set.has('stories/test.html')) problems.push('Testseite stories/test.html darf nicht live gehen');

// Größe der ausgelieferten Seite (AP4.7): GitHub Pages erlaubt höchstens 1 GB, wir warnen früh
const distBytes = files.reduce((sum, f) => sum + statSync(join(dist, f)).size, 0);
const distMb = Math.round(distBytes / 1024 / 1024);
if (distMb > SITE_LIMIT_MB) problems.push(`Seite ist ${distMb} MB groß (Grenze ${SITE_LIMIT_MB} MB), Bilder oder GPX verkleinern`);

for (const req of ['index.html', '404.html']) if (!set.has(req)) problems.push(`${req} fehlt im Build`);
if (files.some((f) => f.endsWith('.woff2')) && !files.some((f) => /^fonts\/OFL.*\.txt$/.test(f))) {
  problems.push('Schriftdateien ohne Lizenztext (fonts/OFL-*.txt) im Build');
}

console.log(`Gebaute Seite geprüft: ${pages.size} Seiten, ${files.length} Dateien, ${distMb} MB (${staging ? 'Staging' : 'Live'}).`);
for (const p of problems) console.error(`  FEHLER: ${p}`);
if (problems.length) {
  console.error(`\n${problems.length} Fehler in der gebauten Seite.`);
  process.exit(1);
}
console.log('Gebaute Seite: alles in Ordnung.');

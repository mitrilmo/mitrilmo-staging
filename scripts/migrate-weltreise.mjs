// Einmalig (AP2.4): übernimmt die 24 Tagesberichte "Weltumrundung 2017" aus der alten Seite als Stories.
// Aufruf:  node scripts/migrate-weltreise.mjs <Ordner der alten Seite>
// Texte bleiben unverändert, Beschreibung = Vorschautext der Karte auf der alten Startseite.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const old = process.argv[2];
if (!old) { console.error('Aufruf: node scripts/migrate-weltreise.mjs <Ordner der alten Seite>'); process.exit(1); }

const dec = (s) => s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const index = readFileSync(join(old, 'index.html'), 'utf8');
const teaser = {};
for (const m of index.matchAll(/<a href="stories\/(weltumrundung-tag-[^"]+)\.html"[\s\S]*?<p class="text-stone-500[^>]*>([\s\S]*?)<\/p>/g)) teaser[m[1]] = dec(m[2]).trim();

const out = join(root, 'src', 'content', 'stories');
mkdirSync(out, { recursive: true });
let n = 0;
for (const file of readdirSync(join(old, 'stories')).filter((f) => /^weltumrundung-tag-.*\.html$/.test(f))) {
  const slug = file.replace(/\.html$/, '');
  const h = readFileSync(join(old, 'stories', file), 'utf8');
  const day = Number(slug.match(/tag-(\d+)-/)[1]);
  const date = slug.match(/(\d{4}-\d{2}-\d{2})/)[1];
  const title = dec(h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]).trim();
  const body = h.match(/<div class="story-content">([\s\S]*?)<\/div>\s*<\/main>/)[1];
  const paras = [...body.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => dec(m[1].replace(/<em>/g, '*').replace(/<\/em>/g, '*').replace(/<strong>/g, '**').replace(/<\/strong>/g, '**')).trim());
  if (!teaser[slug]) throw new Error(`Kein Vorschautext für ${slug}`);
  if (/<[a-z]/i.test(paras.join(''))) throw new Error(`Unerwartetes HTML in ${slug}`);
  const fm = { title, description: teaser[slug], date, category: 'archiv', series: 'weltreise', day };
  writeFileSync(join(out, `${slug}.md`), '---\n' + stringify(fm, { lineWidth: 0 }) + '---\n' + paras.join('\n\n') + '\n');
  n++;
}
console.log(`${n} Tagesberichte geschrieben nach src/content/stories/`);

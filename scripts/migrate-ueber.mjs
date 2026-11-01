// Einmalig (AP2.6): übernimmt den Bereich "Über den Kanal" samt den drei Geschichten (Wer ist Björn, Woher kommt mitrilmo,
// Wie alles begann) der alten Startseite als src/content/pages/ueber-mitrilmo.md.
// Die Tabs der alten Seite werden zu drei Abschnitten untereinander (ohne JavaScript lesbar). Texte bleiben unverändert.
// Aufruf:  node scripts/migrate-ueber.mjs <Ordner der alten Seite>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const old = process.argv[2];
if (!old) { console.error('Aufruf: node scripts/migrate-ueber.mjs <Ordner der alten Seite>'); process.exit(1); }

const html = readFileSync(join(old, 'index.html'), 'utf8');
const dec = (s) => s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const inline = (h, ctx) => {
  const s = h
    .replace(/<span class="text-white (?:font-semibold|font-medium)">([\s\S]*?)<\/span>/g, '**$1**')
    .replace(/<span class="text-white italic">([\s\S]*?)<\/span>/g, '*$1*')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/g, '*$1*');
  if (/<[a-z/]/i.test(s)) throw new Error(`Unerwartetes HTML in ${ctx}: ${s.match(/<[^>]*>/)[0]}`);
  return dec(s).replace(/\s+/g, ' ').trim();
};

// Abschnitt "Über den Kanal": die drei Absätze links
const intro = html.match(/<div class="space-y-4 text-stone-300 text-base leading-relaxed">([\s\S]*?)<\/div>\s*<!-- Feature highlights -->/)[1];
const introParas = [...intro.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => inline(m[1], 'Intro'));
if (introParas.length !== 3) throw new Error('Intro: drei Absätze erwartet');

// Highlights (vier Kacheln), Abo-Knopf und Kennzahlen der Karte rechts
const feat = html.match(/<!-- Feature highlights -->([\s\S]*?)<a\s+href="https:\/\/www\.youtube\.com\/@mitrilmo"/)[1];
const features = [...feat.matchAll(/<div class="text-white font-semibold text-sm">([^<]*)<\/div>\s*<div class="text-stone-500 text-xs mt-0\.5">([^<]*)<\/div>/g)].map((m) => `- **${dec(m[1]).trim()}:** ${dec(m[2]).trim()}`);
if (features.length !== 4) throw new Error('Highlights: vier erwartet');
const facts = [...html.matchAll(/<div class="text-lg font-black text-white">([^<]*)<\/div>\s*<div class="text-xs text-stone-500 mt-0\.5">([^<]*)<\/div>/g)].map((m) => `${dec(m[2]).trim()}: ${dec(m[1]).trim()}`);
if (facts.length !== 3) throw new Error('Kennzahlen: drei erwartet');

const TABS = [['tab-bjoern', 'Wer ist Björn?'], ['tab-name', 'Woher kommt „mitrilmo“?'], ['tab-anfang', 'Wie alles begann']];
const blocks = [...introParas, features.join('\n'),'[Jetzt abonnieren ↗](https://www.youtube.com/@mitrilmo)', `**mitrilmo** · Outdoor · Bergisches Land · NRW. ${facts.join(' · ')}`];
for (const [id, heading] of TABS) {
  const start = html.indexOf(`<div id="${id}"`);
  if (start < 0) throw new Error(`Tab ${id} nicht gefunden`);
  const next = TABS.map(([i]) => html.indexOf(`<div id="${i}"`)).filter((p) => p > start).sort((a, b) => a - b)[0] ?? html.indexOf('</div><!-- /story tabs -->');
  const seg = html.slice(start, next);
  blocks.push(`## ${heading}`);
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>|<p[^>]*>([\s\S]*?)<\/p>|<ul[^>]*>([\s\S]*?)<\/ul>|<div class="my-4 flex[^"]*">([\s\S]*?)<\/div>/g;
  let m, last = 0;
  while ((m = re.exec(seg))) {
    if (m[1] !== undefined) blocks.push(`### ${inline(m[1], id)}`);
    else if (m[2] !== undefined) blocks.push(inline(m[2], id));
    else if (m[3] !== undefined) blocks.push([...m[3].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => `- ${inline(x[1], id)}`).join('\n'));
    else blocks.push(`**${[...m[4].matchAll(/<span[^>]*>([^<]*)<\/span>/g)].map((x) => dec(x[1]).trim()).join(' ')}**`);
    last = re.lastIndex;
  }
  void last;
}

const fm = {
  title: 'Wer steckt hinter mitrilmo?',
  description: 'mitrilmo ist ein persönlicher YouTube-Kanal für Familienausflüge, Wandertouren und ehrliche Gadget-Tests mitten im Bergischen Land. Wer dahintersteckt, woher der Name kommt und wie alles begann.',
  badge: 'Über den Kanal',
};
mkdirSync(join(root, 'src', 'content', 'pages'), { recursive: true });
writeFileSync(join(root, 'src', 'content', 'pages', 'ueber-mitrilmo.md'), '---\n' + stringify(fm, { lineWidth: 0 }) + '---\n' + blocks.join('\n\n') + '\n');
console.log(`ueber-mitrilmo.md: ${blocks.length} Blöcke`);

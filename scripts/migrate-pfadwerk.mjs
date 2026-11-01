// Einmalig (AP2.5): übernimmt pfadwerk.html der alten Seite (Stand: Branch main, mit den Monatscodes 2027) als
//   src/content/pages/pfadwerk.md   (Text und Abbildungen)
//   src/data/premium-codes.js       (Monatscodes, werden monatlich ergänzt)
//   src/assets/images/pfadwerk/     (16 Screenshots, neu kodiert ohne Metadaten)
// Aufruf:  node scripts/migrate-pfadwerk.mjs <pfadwerk.html der alten Seite> <Ordner images/pfadwerk der alten Seite>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { importImage } from './lib/image.mjs';

// Einmaliges Migrationsskript: überschreibt Inhalte (auch von Hand nachgezogene Felder). Nur mit --force starten.
if (!process.argv.includes('--force')) { console.error('Einmaliges Skript, das vorhandene Inhalte überschreibt. Zum bewussten Start --force anhängen.'); process.exit(1); }
process.argv.splice(process.argv.indexOf('--force'), 1);

const root = fileURLToPath(new URL('..', import.meta.url));
const [htmlPath, imgSrcDir] = process.argv.slice(2);
if (!htmlPath || !imgSrcDir) { console.error('Aufruf: node scripts/migrate-pfadwerk.mjs <pfadwerk.html> <images/pfadwerk>'); process.exit(1); }

const html = readFileSync(htmlPath, 'utf8');
const dec = (s) => s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const inline = (h, ctx) => {
  const s = h
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/g, '*$1*')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');
  if (/<[a-z/]/i.test(s)) throw new Error(`Unerwartetes HTML in ${ctx}: ${s.match(/<[^>]*>/)[0]}`);
  return dec(s).replace(/\s+/g, ' ').trim();
};

// Monatscodes
const table = html.match(/var PREMIUM_CODES = \{([\s\S]*?)\};/)[1];
const codes = [...table.matchAll(/'(\d{4}-\d{2})':\s*'([^']+)'/g)].map((m) => [m[1], m[2]]);
if (codes.length < 4) throw new Error('Monatscodes nicht gefunden');
mkdirSync(join(root, 'src', 'data'), { recursive: true });
writeFileSync(join(root, 'src', 'data', 'premium-codes.js'),
`// Freischalt-Codes der Pfadwerk-App, einer pro Monat. Sie stehen absichtlich öffentlich auf pfadwerk.html (Premium ist für alle offen).
// Monatlich am 25. den nächsten Monat ergänzen, alte Zeilen dürfen stehen bleiben. Kein Mastercode, nur Monatscodes.
// Die App akzeptiert nur den Code des laufenden Monats (und in den ersten Tagen den des Vormonats), die Seite wählt nach dem Datum des Besuchers.
export const PREMIUM_CODES = {
${codes.map(([k, v]) => `  '${k}': '${v}',`).join('\n')}
};
`);

// Hauptteil ohne Klassen und Stile
const main = html.match(/<main[\s\S]*?<\/main>/)[0]
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\s(class|style|loading|target|rel|data-[a-z-]+)="[^"]*"/g, '');
const afterH1 = main.slice(main.indexOf('</h1>') + 5);
const status = dec(main.match(/<time[^>]*>([\s\S]*?)<\/time>/)[1]).trim();
const title = dec(main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]).trim();
const ps = [...afterH1.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].slice(0, 2).map((m) => dec(m[1]).trim());
const [subtitle, byline] = ps;

const outImg = join(root, 'src', 'assets', 'images', 'pfadwerk');
mkdirSync(outImg, { recursive: true });
const blocks = [`*${byline}*`];
const re = /<h2>([\s\S]*?)<\/h2>|<p( id="[^"]*")?>([\s\S]*?)<\/p>|<ul>([\s\S]*?)<\/ul>|<img src="images\/pfadwerk\/(Abb\d+)\.jpg" alt="([^"]*)"\s*\/?>|<a\s+href="(https:\/\/play\.google[^"]+)"\s*>([\s\S]*?)<\/a>|<span>([^<]+)<\/span>\s*<span>([^<]+)<\/span>/g;
let m, skipped = 0, premiumDone = false, pendingImg = null, started = false;
const flushImg = (cap) => {
  if (!pendingImg) return;
  const { name, alt } = pendingImg;
  blocks.push(`![${alt}](../../assets/images/pfadwerk/${name}.jpg)` + (cap ? `\n*${cap}*` : ''));
  pendingImg = null;
};
const body = afterH1.slice(afterH1.indexOf('<section'));
const mainBody = afterH1.slice(0, afterH1.indexOf('<section'));
// Titelbild (Abb0) steht vor dem Inhaltsverzeichnis
const splash = mainBody.match(/<img src="images\/pfadwerk\/(Abb0)\.jpg" alt="([^"]*)"/);
if (splash) pendingImg = { name: splash[1], alt: dec(splash[2]) }, flushImg();

while ((m = re.exec(body))) {
  if (m[1] !== undefined) {
    flushImg();
    const sec = m[1].match(/^\s*<span>(\d+)<\/span>\s*([\s\S]*)$/);
    blocks.push(sec ? `## ${Number(sec[1])}. ${inline(sec[2], 'h2')}` : `### ${inline(m[1], 'h3')}`);
  } else if (m[3] !== undefined) {
    const t = m[3];
    if (/Freischalt-Code für/.test(t) || m[2] === ' id="premium-code"' || /Zum Anzeigen des Codes/.test(t)) {
      if (!premiumDone) { flushImg(); blocks.push('<div data-premium-code>Zum Anzeigen des Codes wird JavaScript benötigt.</div>'); premiumDone = true; }
      continue;
    }
    if (/^\s*Abb\. \d+/.test(t) && pendingImg) { flushImg(inline(t, 'caption')); continue; }
    flushImg();
    if (/^\s*Tech-Stack\s*$/.test(t) || /^\s*Aktueller Stand\s*$/.test(t)) { blocks.push(`**${inline(t, 'label')}**`); continue; }
    blocks.push(inline(t, 'p'));
  } else if (m[4] !== undefined) {
    flushImg();
    const items = [...m[4].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => `- ${inline(x[1], 'li')}`);
    blocks.push(items.join('\n'));
  } else if (m[5] !== undefined) {
    flushImg();
    pendingImg = { name: m[5], alt: dec(m[6]) };
  } else if (m[7] !== undefined) {
    flushImg();
    blocks.push(`[${inline(m[8], 'cta')}](${m[7]})`);
  } else if (m[9] !== undefined) {
    flushImg();
    const line = `- **${dec(m[9]).trim()}:** ${dec(m[10]).trim()}`;
    if (blocks.at(-1)?.startsWith('- **')) blocks[blocks.length - 1] += '\n' + line; else blocks.push(line);
  }
}
flushImg();

// Abbildungen übernehmen (Screenshots, höchstens 800 px, ohne Metadaten)
for (let i = 0; i <= 15; i++) await importImage(join(imgSrcDir, `Abb${i}.jpg`), join(outImg, `Abb${i}.jpg`), { max: 800, quality: 80 });

const fm = {
  title,
  description: dec(html.match(/<meta name="description" content="([^"]*)"/)[1]),
  badge: '📱 App-Projekt', subtitle, status,
};
mkdirSync(join(root, 'src', 'content', 'pages'), { recursive: true });
writeFileSync(join(root, 'src', 'content', 'pages', 'pfadwerk.md'), '---\n' + stringify(fm, { lineWidth: 0 }) + '---\n' + blocks.join('\n\n') + '\n');
console.log(`pfadwerk.md: ${blocks.length} Blöcke, ${codes.length} Monatscodes (${codes[0][0]} bis ${codes.at(-1)[0]})`);

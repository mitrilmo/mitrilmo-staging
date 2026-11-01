// Einmalig (AP2.4): übernimmt die restlichen Stories der alten Seite (5 Wanderberichte mit Fotos, 3 KI-Lernkurve, Mammutmarsch-Tipps).
// Die Fotos stecken dort als Base64 im HTML: sie werden herausgelöst, über importImage (ohne Metadaten) nach
// src/assets/images/stories/<slug>/NN.jpg geschrieben und im Markdown eingebunden. Texte bleiben unverändert.
// Aufruf:  node scripts/migrate-stories.mjs <Ordner der alten Seite>
import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { importImage } from './lib/image.mjs';

// Einmaliges Migrationsskript: überschreibt Inhalte (auch von Hand nachgezogene Felder). Nur mit --force starten.
if (!process.argv.includes('--force')) { console.error('Einmaliges Skript, das vorhandene Inhalte überschreibt. Zum bewussten Start --force anhängen.'); process.exit(1); }
process.argv.splice(process.argv.indexOf('--force'), 1);

const root = fileURLToPath(new URL('..', import.meta.url));
const old = process.argv[2];
if (!old) { console.error('Aufruf: node scripts/migrate-stories.mjs <Ordner der alten Seite>'); process.exit(1); }

// Beschreibung für die Karten: Wanderberichte haben auf der alten Seite keine, dort kommt der Anfang des Textes.
const STORIES = [
  { slug: '3-tuerme-weg-hagen-2026-08-23', category: 'unterwegs', tour: '3-tuerme-weg-hagen' },
  { slug: 'einmal-um-die-heilenbecke-talsperre-2026-06-07', category: 'unterwegs', tour: 'heilenbecke-talsperre' },
  { slug: 'elbschetal-rundweg-2026-06-14', category: 'unterwegs', tour: 'elbschetal-rundweg' },
  { slug: 'klutert-wandern-grenzgang-rueggeberg-filde-2026-09-30', category: 'unterwegs' },
  { slug: 'rund-um-die-gloertalsperre-2026-06-21', category: 'unterwegs' },
  { slug: 'mammutmarsch-ueberlebenstipps-2026-09-27', category: 'unterwegs', tour: 'mammutmarsch-ruhrgebiet' },
  { slug: 'ki-lernkurve-teil-1-2026-07-10', category: 'randnotizen', description: 'Kein großer Plan, kein System – nur ChatGPT, Copilot und Gemini nach Lust und Laune gefragt. Wie aus loser Spielerei am Ende doch etwas Ernstes wurde.' },
  { slug: 'ki-lernkurve-teil-2-2026-08-25', category: 'randnotizen', description: 'Ein Redaktionsplan, fertige Skripte, eine eigene Domain – und am Ende eine eigene Website, die sogar einmal umgezogen ist. Wie aus Spielerei ein System wurde.' },
  { slug: 'ki-lernkurve-teil-3-2026-09-25', category: 'randnotizen', description: 'Wochenlang gegen das eigene GPS-Signal gekämpft, einen Kopierschutz gebaut, der mich selbst sabotierte, und Exporte, die lautlos verschwanden. Warum hartnäckige Bugs oft auf das falsche Fundament zeigen.' },
];

const dec = (s) => s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const inline = (h, ctx) => {
  const s = h
    .replace(/<br\s*\/?>/g, '\\\n')
    .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/g, '*$1*')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');
  if (/<[a-z/]/i.test(s)) throw new Error(`Unerwartetes HTML in ${ctx}: ${s.match(/<[^>]*>/)[0]}`);
  return dec(s).trim();
};
const plain = (md) => md.replace(/\\\n/g, ' ').replace(/^#+\s*/, '').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim();
const shorten = (t, max = 280) => {
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return end > 80 ? cut.slice(0, end + 1) : cut.slice(0, cut.lastIndexOf(' ')) + ' …';
};

// Der Statistik-Kasten am Ende steht in der alten Seite als Rohtext mit Markdown-Resten (--- und Aufzählungszeichen) in einem <p>.
// Daraus wird echtes Markdown: Trennlinie, fette Überschrift, Aufzählung. Die Wörter bleiben gleich.
const stats = (t) => {
  const lines = t.replace(/\\\n/g, '\n').split('\n').map((l) => l.trim()).filter((l) => l && l !== '---');
  const [head, ...rest] = lines;
  const title = /^\*\*.*\*\*$/.test(head) ? head : `**${head}**`;
  return ['---', title, rest.map((l) => `- ${l.replace(/^[*-]\s+/, '')}`).join('\n')].filter(Boolean).join('\n\n');
};

const outDir = join(root, 'src', 'content', 'stories');
const tmp = join(tmpdir(), 'mitrilmo-migrate-stories');
mkdirSync(tmp, { recursive: true });

for (const st of STORIES) {
  const html = readFileSync(join(old, 'stories', `${st.slug}.html`), 'utf8');
  const title = dec(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]).trim();
  const date = st.slug.match(/(\d{4}-\d{2}-\d{2})/)[1];
  const body = html.match(/<div class="story-content">([\s\S]*?)<\/div>\s*<\/main>/)[1];
  const hint = html.match(/<p class="video-hint[^>]*>([\s\S]*?)<\/p>/)?.[1];

  const imgDir = join(root, 'src', 'assets', 'images', 'stories', st.slug);
  rmSync(imgDir, { recursive: true, force: true });
  const blocks = [];
  if (hint) blocks.push(inline(hint, `${st.slug} (Videohinweis)`));

  const re = /<div class="blog-image-container">\s*<img src="data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)"[^>]*>\s*<p class="blog-image-caption">([\s\S]*?)<\/p>\s*<\/div>|<h2>([\s\S]*?)<\/h2>|<p(?: class="[^"]*")?>([\s\S]*?)<\/p>/g;
  let last = 0, n = 0, m, afterStatsHead = false;
  while ((m = re.exec(body))) {
    if (body.slice(last, m.index).trim()) throw new Error(`Nicht erfasster Inhalt in ${st.slug}: ${body.slice(last, m.index).trim().slice(0, 80)}`);
    last = re.lastIndex;
    if (m[1] !== undefined) {
      n++;
      const caption = inline(m[2], `${st.slug} (Bildunterschrift)`);
      if (!caption) throw new Error(`Bild ohne Bildunterschrift in ${st.slug}`);
      mkdirSync(imgDir, { recursive: true });
      const nr = String(n).padStart(2, '0');
      const src = join(tmp, `${st.slug}-${nr}.img`);
      writeFileSync(src, Buffer.from(m[1], 'base64'));
      const r = await importImage(src, join(imgDir, `${nr}.jpg`), { max: 1280, quality: 78 });
      if (r.keptExif) throw new Error(`Metadaten im Bild ${nr} von ${st.slug}`);
      // sehr detailreiche Fotos (v. a. Hochformat) werden als WebP über 450 KB groß: dann kleiner nachlegen
      if (statSync(join(imgDir, `${nr}.jpg`)).size > 300_000) await importImage(src, join(imgDir, `${nr}.jpg`), { max: 1000, quality: 72 });
      blocks.push(`![${caption.replace(/[\[\]]/g, '')}](../../assets/images/stories/${st.slug}/${nr}.jpg)\n*${caption}*`);
    } else if (m[3] !== undefined) {
      blocks.push('## ' + inline(m[3], st.slug));
    } else {
      // in einigen Berichten stehen mehrere Absätze mit Markdown-Resten (### ...) in einem <p>; die Reste werden echtes Markdown
      const t = inline(m[4], st.slug);
      // der Statistik-Kasten beginnt mit einer Zeile "---", manchmal mitten in einem Absatz (nach dem Gruß)
      const cut = t.search(/(^|\\\n|\n)---(\\\n|\n|$)/);
      if (afterStatsHead) {
        // Überschrift und Werte stehen in zwei <p> (3-Türme-Weg): die Werte werden zur Aufzählung
        afterStatsHead = false;
        blocks.push(t.split('\\\n').map((l) => l.trim()).filter((l) => l && l !== '---').map((l) => `- ${l.replace(/^[*-]\s+/, '')}`).join('\n'));
      } else if (cut < 0) blocks.push(t.replace(/^### /, '## '));
      else {
        const pre = t.slice(0, cut).replace(/\\$/, '').trim();
        if (pre) blocks.push(pre.replace(/^### /, '## '));
        const box = stats(t.slice(cut).replace(/^(\\\n|\n)/, ''));
        blocks.push(box.replace(/\n{3,}$/, ''));
        afterStatsHead = !box.includes('\n- ');
      }
    }
  }
  if (body.slice(last).trim()) throw new Error(`Nicht erfasster Rest in ${st.slug}`);

  const firstText = blocks.find((b) => !b.startsWith('!') && !b.startsWith('🎥') && !/^#+ /.test(b) && plain(b).length >= 80);
  const description = st.description ?? shorten(plain(firstText));
  const fm = { title, description, date, category: st.category, tour: st.tour };
  if (!fm.tour) delete fm.tour;
  writeFileSync(join(outDir, `${st.slug}.md`), '---\n' + stringify(fm, { lineWidth: 0 }) + '---\n' + blocks.join('\n\n') + '\n');
  console.log(`${st.slug}: ${n} Bilder, ${blocks.length} Blöcke`);
}
rmSync(tmp, { recursive: true, force: true });

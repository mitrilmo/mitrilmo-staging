// Einmalig (AP2.2): übernimmt die restlichen Videos und die 14 Shorts der alten Seite.
// Videos brauchen ein lokales Vorschaubild unter src/assets/images/videos/ (scripts/import-image.mjs), Shorts nicht.
// Aufruf:  node scripts/migrate-videos.mjs
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = join(root, 'src', 'content', 'videos');
const write = (id, fm) => writeFileSync(join(dir, `${id}.md`), '---\n' + stringify(fm, { lineWidth: 0 }) + '---\n');

// Titel wie auf YouTube bzw. in der alten Mediathek
const VIDEOS = [
  { id: 'gML8ApT6qlw', title: '6 Schleusen & 8 Stunden: Im Schneckentempo durch den Pott!', category: 'ausflug' },
  { id: 'ZvyLWwzUsNk', title: 'Outdoor-Navi im Härtetest: Funktioniert es wirklich?', category: 'technik' },
  { id: 'FoGjWRGo9ys', title: 'Megamarsch Düsseldorf - 25 Kilometer bei 30°C Hitze! 🥵', category: 'wandern' },
  { id: '0lX1btjYfzY', title: 'Rucksackhaken', category: 'technik' }, // Vorschaubild fehlt noch
];
const SHORTS = [
  ['0CYM49S-e1k', 'Hilfe, ich seh nur noch ROT! 🍓😂 Karls Erlebnis-Dorf im Check', '2026-08-14'],
  ['FdNjKu18Dr0', 'Waldspaziergang in der XXL-Blechdose! 🌳🥫 #Gasometer #Oberhausen', '2026-08-14'],
  ['H1mDPlOTgQ4', 'Urknall im Gaskessel! Wuppertal hebt ab 💥🚀', '2026-08-05'],
  ['_A4uDbxSqSI', 'LaGa Neuss 2026', '2026-08-01'],
  ['iQg5SGEtB5E', 'Einmal um die Glörtalsperre', '2026-06-21'],
  ['nDMiHsYzSsg', 'Natur pur & dicke Mauern: 12km Elbschetal-Kulturschock! 🥾🧱', '2026-06-14'],
  ['g53o-YH5k3w', 'Restaurant-Tipp Carlos 🏴‍☠️ Captain Krümel & der Beute-Teller! 🍖', '2026-05-31'],
  ['qAJcqMqJ0x8', 'Einkaufs-Tipp: Kuh-Wellness extreme! 🤠🥛', '2026-05-27'],
  ['xoPR-Jg4PxA', 'Unter Tage statt im Bett: Glückauf! ⚒️😴', '2026-05-18'],
  ['kFqtJJH9n0M', 'Freie Bahn für die Asphalt-Helden! 🚲🛼🔥', '2026-05-17'],
  ['y9_PmVi4DKo', 'Ganz schön verkohlt! 💨 Meiler-Spaß im Hülsenbecker Tal 🔥', '2026-05-09'],
  ['_CWkR2IusGE', 'Steinreiche Aussichten & klappernde Räder! 🎡💧 Mühlenmuseum an der Dhünn', '2026-04-29'],
  ['jNkTwfAKLhY', 'Unkraut? Nein, Feinkost! 🌱😋', '2026-04-25'],
  ['q5UYKg0_qNg', 'Steil, steiler, Kettwig! ⛰️🔥 Tag der Steige', '2026-04-18'],
];

for (const v of VIDEOS) {
  if (!existsSync(join(root, 'src', 'assets', 'images', 'videos', `${v.id}.jpg`))) { console.log(`Übersprungen, Vorschaubild fehlt: ${v.id} (${v.title})`); continue; }
  write(v.id, { youtubeId: v.id, title: v.title, thumbnail: `../../assets/images/videos/${v.id}.jpg`, category: v.category });
}
for (const [id, title, d] of SHORTS) write(id, { youtubeId: id, title, format: 'short', category: 'ausflug', publishedAt: d });
console.log(`${SHORTS.length} Shorts geschrieben.`);

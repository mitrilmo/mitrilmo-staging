// Neues Bild importieren:  node scripts/import-image.mjs <Quelle> <Ziel unter src/assets/images> [--max 2400] [--force]
// Beispiel:  node scripts/import-image.mjs "C:\Fotos\IMG_0815.jpg" tours/schneckenlauf-ennepetal.jpg
// Das Ziel heißt wie der Slug des Eintrags (tours/<slug>.jpg) bzw. wie die YouTube-ID (videos/<ID>.jpg).
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { importImage } from './lib/image.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? Number(args[args.indexOf(n) + 1]) : d);
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--max'));
const [src, target] = pos;

if (!src || !target) {
  console.error('Aufruf: node scripts/import-image.mjs <Quelle> <Ziel, z. B. tours/mein-slug.jpg> [--max 2400] [--force]');
  process.exit(1);
}
if (!existsSync(src)) { console.error(`Quelle nicht gefunden: ${src}`); process.exit(1); }
const name = basename(target, extname(target));
const folder = target.split('/')[0];
if (!['tours', 'videos', 'stories', 'news'].includes(folder)) { console.error('Ziel muss mit tours/, videos/, stories/ oder news/ beginnen'); process.exit(1); }
const valid = folder === 'videos' ? /^[A-Za-z0-9_-]{11}$/ : /^[a-z0-9]+(-[a-z0-9]+)*$/;
if (!valid.test(name)) { console.error(`Dateiname "${name}" ist kein gültiger ${folder === 'videos' ? 'YouTube-ID' : 'Slug (a-z, 0-9, Bindestrich)'}`); process.exit(1); }

const dest = join(root, 'src', 'assets', 'images', target);
if (existsSync(dest) && !flag('--force')) { console.error(`Ziel existiert schon: ${dest} (mit --force überschreiben)`); process.exit(1); }
mkdirSync(dirname(dest), { recursive: true });

const r = await importImage(src, dest, { max: opt('--max', 2400) });
console.log(`Importiert: ${target}  ${r.width}×${r.height} px, ${Math.round(statSync(dest).size / 1024)} KB`);
if (r.hadGps) console.log('  Hinweis: Das Original enthielt GPS-Koordinaten. Im neuen Bild sind sie entfernt.');
if (r.keptExif) console.log('  Warnung: Das neue Bild enthält noch Metadaten, bitte prüfen.');
console.log('Nächster Schritt: im Eintrag eintragen, z. B.  image: ../../assets/images/' + target);

// Einmalig (AP2.7): übernimmt die 30 "Sprüche des Tages" der alten Startseite nach src/data/sprueche.js.
// Aufruf:  node scripts/migrate-sprueche.mjs <index.html der alten Seite>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(process.argv[2], 'utf8');
const block = html.match(/const sprueche = \[([\s\S]*?)\];/)[1];
const list = [...block.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
if (list.length !== 30) throw new Error(`30 Sprüche erwartet, gefunden: ${list.length}`);
writeFileSync(join(root, 'src', 'data', 'sprueche.js'),
`// Spruch des Tages der Startseite (Phase 3). Der Spruch wechselt je Kalendertag: Index = Tag des Jahres modulo Anzahl.
export const SPRUECHE = [
${list.map((s) => `  ${JSON.stringify(s)},`).join('\n')}
];

// Gleiche Rechnung wie auf der alten Seite (Tag des Jahres, 1. Januar = 1)
export function spruchFuer(datum = new Date()) {
  const tagDesJahres = Math.floor((datum - new Date(datum.getFullYear(), 0, 0)) / 86400000);
  return SPRUECHE[tagDesJahres % SPRUECHE.length];
}
`);
console.log(`${list.length} Sprüche geschrieben`);

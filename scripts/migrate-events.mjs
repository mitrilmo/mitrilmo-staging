// Einmalig (AP2.5): übernimmt die Event-Karten ("Demnächst in der Region", 13) und die Vorhaben
// ("Demnächst auf dem Kanal", 3) der alten Startseite als Einträge in src/content/events/.
// Aufruf:  node scripts/migrate-events.mjs <Ordner der alten Seite>
// Titel, Ort, Link, Beschreibung und Endtermin kommen aus dem HTML. Startdatum und Uhrzeit stehen in der Karte nur als Text
// ("1.–4. Okt.", "10:15 Uhr") und sind unten von Hand zugeordnet. Unbekanntes ("Preis unbekannt") bleibt leer.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const old = process.argv[2];
if (!old) { console.error('Aufruf: node scripts/migrate-events.mjs <Ordner der alten Seite>'); process.exit(1); }

const dec = (s) => s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const CATEGORY = { 'Food & Fun': 'markt', Wandern: 'wandern', Outdoor: 'outdoor' };
// Startdatum, Uhrzeit und Slug je Endtermin+Titel (aus der Kartenzeile "1.–4. Okt." usw.)
const EXTRA = {
  'Herbstmarkt & Panhasfest': { slug: 'hattingen-herbstmarkt-panhasfest-2026', start: '2026-10-01' },
  'Herbstmarkt Hindenburgstraße': { slug: 'remscheid-herbstmarkt-hindenburgstrasse-2026', time: '8–16 Uhr' },
  'Von der Gerstau nach Lüttringhausen': { slug: 'remscheid-sgv-gerstau-luettringhausen-2026-10-10', time: '10:15 Uhr' },
  'Wiese der Elfringhauser Schweiz': { slug: 'remscheid-sgv-elfringhauser-schweiz-2026-10-17', time: '10:30 Uhr' },
  'Ennepetal–Breckerfeld': { slug: 'breckerfeld-49ontop-ennepetal-breckerfeld-2026-10-18', time: '11 Uhr' },
  'Gemeinsam unterwegs': { slug: 'radevormwald-gemeinsam-unterwegs-2026-10-29', time: '16:30–18:30 Uhr' },
  'Halloween Run & Walk': { slug: 'hueckeswagen-halloween-run-walk-2026', time: '16–20 Uhr' },
  'Fackel-Nachtwanderung': { slug: 'remscheid-sgv-fackel-nachtwanderung-2026-10-31', time: '19 Uhr' },
  'Weihnachtsmarkt Lüttringhausen': { slug: 'remscheid-weihnachtsmarkt-luettringhausen-2026' },
  'Vohwinkeler Weihnachtsmarkt': { slug: 'wuppertal-vohwinkeler-weihnachtsmarkt-2026', start: '2026-11-27' },
  'Schloßbergweihnacht': { slug: 'solingen-schlossbergweihnacht-2026', start: '2026-11-28' },
  'Weihnachtsmarkt Hattingen': { slug: 'hattingen-weihnachtsmarkt-2026', start: '2026-11-23' },
  'Remscheider Weihnachtstreff': { slug: 'remscheid-weihnachtstreff-2026', start: '2026-11-13' },
};
// "Zeiten sind nicht bekannt – Termin vor Besuch selbst gegenchecken": der Hinweis steht als note, nicht in der Beschreibung
const SPLIT = / ?(?:–|-) ?(Termin vor Besuch selbst gegenchecken\.?)$/;

const html = readFileSync(join(old, 'index.html'), 'utf8').split('\n');
const region = html.slice(1065, 1283).join('\n');
const dir = join(root, 'src', 'content', 'events');
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const write = (slug, fm) => writeFileSync(join(dir, `${slug}.md`), '---\n' + stringify(fm, { lineWidth: 0 }) + '---\n');

let n = 0;
for (const m of region.matchAll(/<a href="([^"]+)"[^>]*data-end="([^"]+)"[\s\S]*?<\/a>/g)) {
  const texts = [...m[0].matchAll(/<(?:span|p)[^>]*>([^<]*)</g)].map((x) => dec(x[1]).trim()).filter(Boolean);
  const [badge, location, title, descRaw, price, when] = texts;
  const x = EXTRA[title];
  if (!x) throw new Error(`Kein Eintrag in EXTRA für "${title}"`);
  const hasNote = SPLIT.test(descRaw);
  const description = descRaw.replace(SPLIT, '').trim().replace(/([^.!?])$/, '$1.');
  write(x.slug, {
    title, startDate: x.start, endDate: m[2], time: x.time, location, price: price === 'Preis unbekannt' ? undefined : price,
    url: m[1], category: CATEGORY[badge] ?? 'sonstiges', description, note: hasNote ? 'Termin vor Besuch selbst gegenchecken.' : undefined,
  });
  n++;
}
// Vorhaben des Kanals
const upcoming = [
  { slug: 'kanal-trasse-zum-luftkurort-2026-12-13', title: 'Wanderung: Auf der Trasse zum Luftkurort', date: '2026-12-13', location: 'Bergisches Land',
    description: 'Vom glitzernden Ufer der Hasper Talsperre folgen wir gemächlich dem historischen Tram-Pfad hinauf zu weiten Höhenpanoramen und der fotogenen Breckerfelder Mühle, bevor es mit besten Weitblicken ganz entspannt wieder hinab ans Wasser geht.', note: 'Community-Event, Video folgt.' },
  { slug: 'kanal-mammutmarsch-dresden-2027-06-05', title: 'Mammutmarsch Dresden 30 Kilometer', date: '2027-06-05', location: 'Sachsen',
    description: '30 Kilometer beim Mammutmarsch Dresden 2027 bedeuten: Ein wunderschöner Spaziergang an der Elbe entlang, bei dem deine Beine ab Kilometer 20 ernsthaft hinterfragen, ob Sightseeing nicht auch im Sitzen geht.', note: 'Community-Event, Video folgt.' },
  { slug: 'kanal-ultrawandern-koelnpfad-2027-06-26', title: 'UltraWandern auf dem Kölnpfad', date: '2027-06-26', location: 'Köln',
    description: '35 km Dämmerungswanderung von Bergisch Gladbach nach Köln Stammheim über den Kölnpfad.', note: 'Solo-Tour, Video folgt.' },
];
// Kontrolle gegen die alte Seite: Titel und Beschreibung der Vorhaben müssen dort stehen
const flat = html.join('\n').replace(/&amp;/g, '&');
for (const u of upcoming) {
  if (!flat.includes(u.description.slice(0, 60))) throw new Error(`Beschreibung nicht in der alten Seite: ${u.title}`);
  write(u.slug, { title: u.title, scope: 'kanal', endDate: u.date, location: u.location, category: 'sonstiges', description: u.description, note: u.note });
  n++;
}
console.log(`${n} Einträge geschrieben nach src/content/events/`);

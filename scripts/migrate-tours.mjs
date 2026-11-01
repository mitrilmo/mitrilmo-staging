// Einmalig (AP2.1): übernimmt die Touren aus dem JS-Array `alle` der alten Seite (Branch neubau-vorarbeit),
// dazu die drei neuen Touren aus den Video-Karten und die Videos, auf die Touren verweisen.
// Aufruf:  node scripts/migrate-tours.mjs <Ordner der alten Seite>
// Bilder, GPX und Video-Vorschaubilder müssen vorher importiert sein (scripts/import-image.mjs, GPX nach public/gpx/).
// Nichts wird erfunden: Unbekanntes bleibt leer.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const old = process.argv[2];
if (!old) { console.error('Aufruf: node scripts/migrate-tours.mjs <Ordner der alten Seite>'); process.exit(1); }

const html = readFileSync(join(old, 'index.html'), 'utf8');
const start = html.indexOf('  alle = [');
let depth = 0;
const open = html.indexOf('[', start);
let end = open;
for (; end < html.length; end++) {
  if (html[end] === '[') depth++;
  if (html[end] === ']' && --depth === 0) break;
}
const alle = new Function('return ' + html.slice(open, end + 1))();

// Slug-Tabelle (freigegeben): alte ID -> neuer Slug
const SLUG = { '3-turme-weg-hagen': '3-tuerme-weg-hagen', 'huelsenbach-tal': 'huelsenbecker-tal', 'dhünn-dom': 'altenberger-dom' };
const SEASON = { Frühling: 'fruehling', Sommer: 'sommer', Herbst: 'herbst', Winter: 'winter' };
const NOT_EQUIPMENT = new Set(['Hundefreundlich', 'Familienfreundlich', 'Keine Besonderheiten']); // stehen schon als eigene Felder
const tri = (v) => (v === true ? 'ja' : v === false ? 'nein' : undefined);
const ytId = (u) => (u ? u.match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{11})/)?.[1] : undefined);
// Tipp-Satz mit Glühbirne steht schon im Feld tips, Schluss-Emojis entfallen
const clean = (t) => t.replace(/\s*💡[\s\S]*$/u, '').replace(/[\s\p{Extended_Pictographic}‍️]+$/gu, '').trim();

// Von Hand ergänzt: Ort (Bestand hat nur "region"), Datum der ersten Veröffentlichung auf der alten Seite (aus Git),
// Koordinaten aus dem GPX-Start (Heilenbecke, Neye, die drei neuen), Alt-Texte als schlichte Platzhalter.
const EXTRA = {
  '3-tuerme-weg-hagen': { place: 'Hagen', publishedAt: '2026-08-23', imageAlt: 'Illustration: Wandergruppe mit Wanderstöcken vor den drei Türmen des Hagener 3-Türme-Wegs', stories: ['3-tuerme-weg-hagen-2026-08-23'] },
  'der-talsperrenweg-hasper-talsperre': { publishedAt: '2026-08-16' },
  'elbschetal-rundweg': { publishedAt: '2026-06-15' },
  'trassentrecking-im-pott': { publishedAt: '2026-05-19' },
  'huelsenbecker-tal': { publishedAt: '2026-05-19' },
  'heilenbecke-talsperre': { publishedAt: '2026-06-07', coordinates: { lat: 51.25655, lng: 7.37113 } },
  'neyetalsperre-rundweg': { publishedAt: '2026-06-06', coordinates: { lat: 51.14602, lng: 7.38934 } },
  'altenberger-dom': { publishedAt: '2026-05-19' },
};
// Drei neue Touren: Angaben aus den Video-Karten (Ausflugs-Check), Länge laut GPX
const NEU = [
  { slug: 'pilger-alarm-breckerfeld', title: 'Pilger-Alarm in Breckerfeld – Mühlenhof & Königsheide', place: 'Breckerfeld', region: 'Bergisches Land', difficulty: 'leicht', duration: 'ca. 3 Std.', distanceKm: 6.7, video: 'GY_mduwHqV4', strollerOk: 'nein', parking: { name: 'Breckerfeld-Delle', cost: 'kostenfrei' }, publishedAt: '2026-10-25',
    description: 'Knapp 7 km durch die Breckerfelder Landkulisse – vorbei am Historischen Mühlenhof und rund um die Königsheide. Mit dieser Begegnung mitten auf dem Weg habe ich nicht gerechnet: Plötzlich kreuzt eine Pilgerin meine Tour!' },
  { slug: 'schneckenlauf-ennepetal', title: 'Schneckenlauf in Ennepetal', place: 'Ennepetal', region: 'Bergisches Land', difficulty: 'mittel', duration: 'ca. 3–4 Std.', distanceKm: 10.6, video: 'poFIYRmw_aw', strollerOk: 'nein', parking: { name: 'Wanderparkplatz Ennepetal-Rüggeberg' }, publishedAt: '2026-09-20',
    description: '10,5 km entspanntes Wandern im idyllischen Ennepetal – pure Natur, bis das Eisen glüht! Begleite uns auf unserer Walking-Tour zum traditionellen Schmiedefest am historischen Krenzer Hammer.' },
  { slug: 'mammutmarsch-ruhrgebiet', title: 'Nachtmammutmarsch Ruhrgebiet 30 km', place: 'Ruhrgebiet', startPoint: 'Landschaftspark Duisburg-Nord', difficulty: 'schwer', duration: 'ca. 7–8 Std.', distanceKm: 30.3, video: 'q_ee_VkBWME', parking: { name: 'Landschaftspark Duisburg-Nord' }, publishedAt: '2026-09-01',
    description: '30 km durch die Pott-Nacht: Füße brennen, Augen zu – aber die Medaille und das Zielbier rufen!' },
];
// Videos, auf die Touren verweisen (Titel wie auf YouTube, Vorschaubild lokal). Rest der Mediathek: AP2.2.
const VIDEOS = [
  { id: 'iw7wg-KqpSU', title: 'Expedition Hasper Talsperre', category: 'wandern' },
  { id: 'cZt9hn0tH3E', title: 'Dämme brechen nur vor Begeisterung! 🌊🚶‍♂️', category: 'wandern' },
  { id: 'GY_mduwHqV4', title: 'Pilger-Alarm in Breckerfeld – Mühlenhof & Königsheide', category: 'wandern', description: 'Knapp 7 km durch die Breckerfelder Landkulisse – vorbei am Historischen Mühlenhof und rund um die Königsheide.' },
  { id: 'poFIYRmw_aw', title: 'Schneckenlauf in Ennepetal', category: 'wandern', description: 'Walking-Tour zum traditionellen Schmiedefest am historischen Krenzer Hammer.' },
  { id: 'q_ee_VkBWME', title: '30 KM durch die NACHT! ⚡ Mammutmarsch Ruhrgebiet', category: 'wandern', description: '30 km durch die Pott-Nacht.' },
  { id: 'Wor2_Zau2sE', title: 'Dom-Hopping im Grünen: Von der Dhünn zum Dom!', category: 'wandern' },
];

const gpxStart = (slug) => {
  const p = join(root, 'public', 'gpx', `${slug}.gpx`);
  const m = existsSync(p) && readFileSync(p, 'utf8').match(/<trkpt[^>]*?lat="([-\d.]+)"[^>]*?lon="([-\d.]+)"/);
  return m ? { lat: Number(Number(m[1]).toFixed(5)), lng: Number(Number(m[2]).toFixed(5)) } : undefined;
};
const thumbDir = join(root, 'src', 'assets', 'images', 'videos');
const THUMBS = new Set(readdirSync(thumbDir).map((f) => f.replace(/\.jpg$/, '')));

const tourDir = join(root, 'src', 'content', 'tours');
const videoDir = join(root, 'src', 'content', 'videos');
mkdirSync(tourDir, { recursive: true });
mkdirSync(videoDir, { recursive: true });
const drop = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
const write = (dir, name, fm) => writeFileSync(join(dir, `${name}.md`), '---\n' + stringify(drop(fm), { lineWidth: 0 }) + '---\n');
const withoutVideo = [];

for (const t of alle) {
  const slug = SLUG[t.id] ?? t.id;
  const x = EXTRA[slug] ?? {};
  const title = t.name.replace(/!$/, '');
  const park = t.anreise?.auto;
  const note = [park?.hinweis, t.anreise?.fussweg].filter(Boolean).join('. ');
  const vid = ytId(t.youtube);
  if (vid && !THUMBS.has(vid)) withoutVideo.push(`${slug}: ${vid}`);
  const equipment = (t.ausruestung || []).filter((e) => !NOT_EQUIPMENT.has(e));
  write(tourDir, slug, {
    title, kind: 'tour', activity: 'wandern', place: x.place ?? t.region, region: x.place ? t.region : undefined,
    description: clean(t.beschreibung), distanceKm: t.distanz, duration: t.dauer, difficulty: t.schwierigkeit,
    image: `../../assets/images/tours/${slug}.jpg`, imageAlt: x.imageAlt ?? `Titelbild zur Tour ${title}`,
    gpx: t.gpx, coordinates: t.koordinaten ?? x.coordinates ?? gpxStart(slug),
    video: vid && THUMBS.has(vid) ? vid : undefined, stories: x.stories, komoot: t.komoot,
    parking: park ? drop({ name: park.parkplatz, cost: park.kosten, note: note || undefined }) : undefined,
    familyFriendly: tri(t.familienfreundlich), dogFriendly: tri(t.hundefreundlich),
    openingHours: t.oeffnungszeiten, prices: t.preise,
    refreshments: t.verpflegung?.length ? t.verpflegung : undefined, equipment: equipment.length ? equipment : undefined,
    bestSeasons: t.beste_jahreszeit?.length ? t.beste_jahreszeit.map((s) => SEASON[s]) : undefined,
    tips: (t.tipps || '').trim() || undefined, publishedAt: x.publishedAt,
  });
}
for (const { slug, ...r } of NEU) {
  write(tourDir, slug, {
    title: r.title, kind: 'tour', activity: 'wandern', place: r.place, region: r.region, startPoint: r.startPoint, description: r.description,
    distanceKm: r.distanceKm, duration: r.duration, difficulty: r.difficulty,
    image: `../../assets/images/tours/${slug}.jpg`, imageAlt: `Titelbild zur Tour ${r.title}`,
    gpx: `gpx/${slug}.gpx`, coordinates: gpxStart(slug), video: r.video, parking: r.parking, strollerOk: r.strollerOk, publishedAt: r.publishedAt,
  });
}
for (const v of VIDEOS) {
  if (!THUMBS.has(v.id)) throw new Error(`Vorschaubild fehlt: ${v.id}`);
  write(videoDir, v.id, { youtubeId: v.id, title: v.title, description: v.description, thumbnail: `../../assets/images/videos/${v.id}.jpg`, category: v.category });
}
console.log(`${alle.length + NEU.length} Touren und ${VIDEOS.length} Videos geschrieben.`);
if (withoutVideo.length) console.log('Ohne lokales Vorschaubild, daher ohne video-Verweis:\n  ' + withoutVideo.join('\n  '));

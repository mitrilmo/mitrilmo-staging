// Paritätsprüfung (AP2.7): vergleicht die alte Seite (Branch main des Repos mitrilmo-website) mit den Inhalten des Neubaus.
// Aufruf:  node scripts/parity.mjs <Ordner des alten Repos>        (liest index.html, pfadwerk.html und stories/ aus Branch main)
// Ausgabe: Zahlen, Fundstellen und alles, was im Neubau noch fehlt. Beendet mit Exit-Code 1, wenn etwas fehlt.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const oldRepo = process.argv[2];
if (!oldRepo) { console.error('Aufruf: node scripts/parity.mjs <Ordner des alten Repos>'); process.exit(1); }
const show = (p) => execFileSync('git', ['show', `main:${p}`], { cwd: oldRepo, encoding: 'utf8', maxBuffer: 1 << 28 });
const ls = (d) => execFileSync('git', ['ls-tree', '--name-only', `main:${d}`], { cwd: oldRepo, encoding: 'utf8' }).split('\n').filter(Boolean);

const index = show('index.html');
const missing = [];
const rows = [];
// Bewusste Abweichungen (begründet): erscheinen in der Liste als "bewusst", nicht als Fehler
const DEVIATIONS = {
  'altenberger-dom: Distanz 12.5': 'Neubau 16,4 km: GPX aus Hin- und Rückweg verbunden (Commit 33b413a auf neubau-vorarbeit), main hat noch 12,5 km',
};
const deviated = [];
const check = (area, oldN, found, notFound) => {
  // Eine Prüfung ohne Treffer in der alten Seite ist wertlos (Suchmuster passt nicht mehr): als Fehler melden
  if (!oldN) notFound = [...notFound, 'keine Treffer in der alten Seite, Suchmuster prüfen'];
  const real = notFound.filter((m) => !DEVIATIONS[m]);
  deviated.push(...notFound.filter((m) => DEVIATIONS[m]).map((m) => `${m}: ${DEVIATIONS[m]}`));
  rows.push([area, oldN, found, real.length ? `FEHLT: ${real.join(', ')}` : notFound.length ? 'vollständig (1 bewusste Abweichung)' : 'vollständig']);
  for (const m of real) missing.push(`${area}: ${m}`);
};
const safe = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const dir = (c) => readdirSync(join(root, 'src', 'content', c)).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
const fm = (c, id) => readFileSync(join(root, 'src', 'content', c, `${id}.md`), 'utf8');
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"');
const norm = (s) => dec(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// 1. Touren (JS-Array alle)
const start = index.indexOf('  alle = [');
let depth = 0, end = index.indexOf('[', start);
for (const open = end; end < index.length; end++) { if (index[end] === '[') depth++; if (index[end] === ']' && --depth === 0) break; void open; }
const alle = new Function('return ' + index.slice(index.indexOf('[', start), end + 1))();
const SLUG = { '3-turme-weg-hagen': '3-tuerme-weg-hagen', 'huelsenbach-tal': 'huelsenbecker-tal', 'dhünn-dom': 'altenberger-dom' };
const tours = dir('tours');
check('Touren', alle.length, alle.filter((t) => tours.includes(SLUG[t.id] ?? t.id)).length,
  alle.filter((t) => !tours.includes(SLUG[t.id] ?? t.id)).map((t) => t.id));
const fieldGaps = [];
for (const t of alle) {
  const slug = SLUG[t.id] ?? t.id;
  if (!tours.includes(slug)) continue;
  const f = fm('tours', slug);
  if (t.distanz && !f.includes(`distanceKm: ${t.distanz}`)) fieldGaps.push(`${slug}: Distanz ${t.distanz}`);
  if (t.gpx && !existsSync(join(root, 'public', t.gpx))) fieldGaps.push(`${slug}: GPX ${t.gpx}`);
  if (t.komoot && !f.includes(t.komoot)) fieldGaps.push(`${slug}: Komoot-Link`);
  if (t.oeffnungszeiten && !f.includes(t.oeffnungszeiten.slice(0, 20))) fieldGaps.push(`${slug}: Öffnungszeiten`);
  if (t.preise && !f.includes(t.preise.slice(0, 20))) fieldGaps.push(`${slug}: Preise`);
  const maps = t.anreise?.auto?.maps || t.anreise?.maps;
  if (maps) rows.push([`Tour ${slug}`, 'Karten-Link', f.includes(maps) ? 'ja' : 'nein', f.includes(maps) ? 'vollständig' : `FEHLT: ${maps}`]), f.includes(maps) || missing.push(`Tour ${slug}: Karten-Link ${maps}`);
}
check('Tourenfelder (Distanz, GPX, Komoot, Zeiten, Preise)', alle.length, alle.length - new Set(fieldGaps.map((g) => g.split(':')[0])).size, fieldGaps);

// 2. Videos und Shorts: jede YouTube-ID der alten Startseite
const ids = new Set([...index.matchAll(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/g)].map((m) => m[1]));
const videos = dir('videos');
const tourVideos = new Set(alle.map((t) => t.youtube?.match(/([A-Za-z0-9_-]{11})$/)?.[1]).filter(Boolean));
check('Videos und Shorts (YouTube-IDs der Startseite)', ids.size, [...ids].filter((i) => videos.includes(i)).length, [...ids].filter((i) => !videos.includes(i)));
check('Video-Verweise der Touren', tourVideos.size, [...tourVideos].filter((i) => videos.includes(i)).length, [...tourVideos].filter((i) => !videos.includes(i)));

// 3. Stories: alle Dateien in stories/
const stories = dir('stories');
const oldStories = ls('stories').filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''));
check('Stories (Dateien in stories/)', oldStories.length, oldStories.filter((s) => stories.includes(s)).length, oldStories.filter((s) => !stories.includes(s)));

// 4. Events der Startseite (Region und Kanal)
const events = dir('events').map((id) => ({ id, t: norm(fm('events', id).match(/^title: (.*)$/m)?.[1] ?? '') }));
const evSection = index.slice(index.indexOf('id="eventsSection"'), index.indexOf('id="upcomingSection"'));
const evRegion = [...evSection.matchAll(/data-end="([^"]+)"[\s\S]*?<p class="text-white text-sm font-bold[^>]*>([^<]*)</g)].map((m) => ({ end: m[1], title: dec(m[2]).trim() }));
const evKanal = ['Wanderung: Auf der Trasse zum Luftkurort', 'Mammutmarsch Dresden 30 Kilometer', 'UltraWandern auf dem Kölnpfad'];
const evAll = [...evRegion.map((e) => e.title), ...evKanal];
if (evRegion.length !== 13) missing.push(`Events: 13 Karten der Region erwartet, gefunden ${evRegion.length}`);
check('Events und Vorhaben', evAll.length, evAll.filter((t) => events.some((e) => e.t === norm(t))).length, evAll.filter((t) => !events.some((e) => e.t === norm(t))));

// 5. Neuigkeiten (Blog-Slider) und Wanderberichte-Liste
const news = dir('news').map((id) => norm(fm('news', id).match(/^title: (.*)$/m)?.[1] ?? ''));
const blogTitles = [...index.matchAll(/^\s{8}title: '([^']+)',\s*$/gm)].map((m) => m[1]);
check('Neuigkeiten (Blog-Slider)', blogTitles.length, blogTitles.filter((t) => news.some((n) => n === norm(t))).length, blogTitles.filter((t) => !news.some((n) => n === norm(t))));
const wb = [...index.matchAll(/titel: "([^"]+)", datum: "[^"]+", datumISO: "([^"]+)", datei: "stories\/([^"]+)\.html"/g)];
check('Wanderberichte-Liste', wb.length, wb.filter((m) => stories.includes(m[3])).length, wb.filter((m) => !stories.includes(m[3])).map((m) => m[3]));

// 6. Pfadwerk: Monatscodes und Textstücke
const pf = show('pfadwerk.html');
const codes = [...pf.matchAll(/'(\d{4}-\d{2})':\s*'([^']+)'/g)].map((m) => [m[1], m[2]]);
const newCodes = readFileSync(join(root, 'src', 'data', 'premium-codes.js'), 'utf8');
check('Pfadwerk-Monatscodes', codes.length, codes.filter(([k, v]) => newCodes.includes(`'${k}': '${v}'`)).length, codes.filter(([k, v]) => !newCodes.includes(`'${k}': '${v}'`)).map(([k]) => k));

// 7. Externe Links der alten Startseite (nur Inhalte, keine Skripte): jede Adresse muss irgendwo im Neubau stehen
const corpus = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (['.md', '.astro', '.js', '.ts', '.html', '.json'].includes(extname(p))) corpus.push(readFileSync(p, 'utf8')); } };
for (const d of ['src', 'public/gpx']) if (existsSync(join(root, d))) walk(join(root, d));
const all = corpus.join('\n');
// YouTube-Adressen deckt die ID-Prüfung oben ab, Bilder auf mitrilmo.com sind Meta-Angaben (SEO, Phase 4)
// img.youtube.com und yt3.ggpht.com waren Bild-Fallbacks (Anfrage an Google beim Laden), im Neubau bewusst entfernt: nur lokale Bilder
const SKIP = /youtu\.be\/|youtube\.com\/(shorts|watch)|mitrilmo\.com\/images\/|img\.youtube\.com|yt3\.ggpht\.com|cdn\.tailwindcss|mobrain\.tail|googleapis|gstatic|w3\.org|schema\.org|policies\.google|ec\.europa|opendatacommons|tailscale\.com|openstreetmap\.org\/copyright/;
const urls = [...new Set([...index.matchAll(/https?:\/\/[^\s"'<>)\\`]+/g)].map((m) => dec(m[0]).replace(/[.,;]+$/, '')).filter((u) => !SKIP.test(u)))];
const allDec = safe(all);
const urlMissing = urls.filter((u) => !all.includes(u) && !allDec.includes(safe(u)) && !all.includes(encodeURI(safe(u))) && !all.includes(u.replace(/^https?:\/\/(www\.)?/, '')));
check('Externe Links der Startseite', urls.length, urls.length - urlMissing.length, urlMissing);

// 8. Sprüche des Tages
const spr = [...index.match(/const sprueche = \[([\s\S]*?)\];/)[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
const sprNew = readFileSync(join(root, 'src', 'data', 'sprueche.js'), 'utf8');
check('Sprüche des Tages', spr.length, spr.filter((x) => sprNew.includes(JSON.stringify(x))).length, spr.filter((x) => !sprNew.includes(JSON.stringify(x))));

// Ausgabe
const w = (s, n) => String(s).padEnd(n);
console.log(`${w('Bereich', 58)}${w('alt', 6)}${w('neu', 6)}Ergebnis`);
for (const [a, o, n, r] of rows) console.log(`${w(a, 58)}${w(o, 6)}${w(n, 6)}${r.length > 160 ? r.slice(0, 160) + ' …' : r}`);
for (const m of missing) console.log(`  fehlt: ${m}`);
for (const d of deviated) console.log(`  bewusst abweichend: ${d}`);
console.log(missing.length ? `\n${missing.length} Fundstelle(n) fehlen im Neubau.` : '\nParität der geprüften Inhalte erfüllt.');
process.exit(missing.length ? 1 : 0);

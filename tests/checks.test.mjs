import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEntries, checkHtml, checkLinks, checkLegal, gpxLengthKm, UMAMI } from '../scripts/lib/checks.mjs';

// --- GPX ---
const gpx = (...segments) =>
  `<?xml version="1.0"?><gpx><trk>${segments
    .map((n) => `<trkseg>${Array.from({ length: n.count }, (_, i) => `<trkpt lat="${51 + (n.start ?? 0) + i * 0.01}" lon="7.0"></trkpt>`).join('')}</trkseg>`)
    .join('')}</trk></gpx>`;

test('GPX-Länge: 10 Punkte im Abstand 0,01 Grad sind etwa 10 km', () => {
  const km = gpxLengthKm(gpx({ count: 10 }));
  assert.ok(km > 9.9 && km < 10.1, String(km));
});
test('GPX-Länge: zwei Abschnitte werden einzeln summiert, die Lücke zählt nicht', () => {
  const km = gpxLengthKm(gpx({ count: 6 }, { count: 6, start: 5 })); // 5 Abschnitte je 1,11 km, zweiter Abschnitt 5 Grad weiter
  assert.ok(km > 11.0 && km < 11.2, String(km)); // 2 x 5,56 km, die Lücke von 5 Grad zählt nicht
});
test('GPX-Länge: ohne Trackpunkte null', () => {
  assert.equal(gpxLengthKm('<gpx></gpx>'), null);
});

// --- Inhalte ---
const baseData = () => ({
  tours: {
    'heilenbecke-talsperre': { image: 'images/a.jpg', gpx: 'gpx/a.gpx', distanceKm: 10, video: 'k1JNFJuXz7o', stories: ['story-eins-2026-06-07'], coordinates: { lat: 51, lng: 7 } },
  },
  videos: { k1JNFJuXz7o: { youtubeId: 'k1JNFJuXz7o', thumbnail: 'images/k1JNFJuXz7o.jpg' } },
  stories: { 'story-eins-2026-06-07': { tour: 'heilenbecke-talsperre' } },
  events: {}, projects: {},
});
const io = (missing = [], km = 10) => ({ exists: (p) => !missing.includes(p), gpxKm: () => km });
const errs = (data, i) => checkEntries(data, i).errors;

test('Inhalte: gültiger Satz hat keine Fehler', () => {
  assert.deepEqual(errs(baseData(), io()), []);
});
test('Inhalte: ungültiger Slug im Dateinamen', () => {
  const d = baseData(); d.tours['Heilenbecke_Talsperre'] = d.tours['heilenbecke-talsperre'];
  assert.ok(errs(d, io()).some((e) => /kein gültiger Slug/.test(e)));
});
test('Inhalte: Videodatei muss YouTube-ID heißen und zur youtubeId passen', () => {
  const d = baseData(); d.videos.k1JNFJuXz7o.youtubeId = 'andereId0000';
  assert.ok(errs(d, io()).some((e) => /passt nicht zum Dateinamen/.test(e)));
  const d2 = baseData(); d2.videos['zu-kurz'] = { youtubeId: 'zu-kurz' };
  assert.ok(errs(d2, io()).some((e) => /YouTube-ID/.test(e)));
});
test('Inhalte: fehlende Bild- und GPX-Dateien', () => {
  const e = errs(baseData(), io(['images/a.jpg', 'gpx/a.gpx', 'images/k1JNFJuXz7o.jpg']));
  assert.equal(e.filter((x) => /Datei, die es nicht gibt/.test(x)).length, 3);
});
test('Inhalte: GPX-Länge weicht von der Angabe ab (Fall Altenberger Dom: 8,3 gemessen, 12,5 angegeben)', () => {
  const d = baseData(); d.tours['heilenbecke-talsperre'].distanceKm = 12.5;
  const e = errs(d, io([], 8.3));
  assert.ok(e.some((x) => /GPX misst 8\.3 km, Angabe ist 12\.5 km/.test(x)), JSON.stringify(e));
  d.tours['heilenbecke-talsperre'].distanceKm = 8.4; // kleine Abweichung ist erlaubt
  assert.deepEqual(errs(d, io([], 8.3)), []);
});
test('Inhalte: GPX nicht lesbar', () => {
  assert.ok(errs(baseData(), io([], null)).some((e) => /GPX nicht lesbar/.test(e)));
});
test('Inhalte: Referenzen auf nicht vorhandene Videos, Stories und Touren', () => {
  const d = baseData();
  d.tours['heilenbecke-talsperre'].video = 'gibtEsNicht0';
  d.tours['heilenbecke-talsperre'].stories = ['gibt-es-nicht'];
  d.stories['story-eins-2026-06-07'].tour = 'keine-tour';
  const e = errs(d, io());
  assert.ok(e.some((x) => /Video gibtEsNicht0 gibt es nicht/.test(x)));
  assert.ok(e.some((x) => /Story gibt-es-nicht gibt es nicht/.test(x)));
  assert.ok(e.some((x) => /Tour keine-tour gibt es nicht/.test(x)));
});
test('Inhalte: fehlende Koordinaten sind nur ein Hinweis', () => {
  const d = baseData(); delete d.tours['heilenbecke-talsperre'].coordinates;
  const r = checkEntries(d, io());
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => /kein Pin/.test(w)));
});

// --- gebaute Seiten ---
const page = ({ title = '<title>Start</title>', desc = '<meta name="description" content="Eine ausreichend lange Beschreibung der Seite.">', canon = '<link rel="canonical" href="https://mitrilmo.github.io/mitrilmo-staging/index.html">', umami, robots = '<meta name="robots" content="noindex, nofollow">', head = '', body = '', lang = 'de' } = {}) => {
  const u = umami ?? `<script defer src="${UMAMI.src}" data-website-id="${UMAMI.websiteId}" data-domains="${UMAMI.domains}"></script>`;
  return `<!doctype html><html lang="${lang}"><head>${title}${desc}${canon}${robots}${head}${u}</head><body>${body}</body></html>`;
};
const hasProblem = (html, re, opts) => checkHtml(html, opts).some((p) => re.test(p));

test('Seite: gültige Staging-Seite ohne Probleme', () => {
  assert.deepEqual(checkHtml(page(), { staging: true }), []);
});
test('Seite: Live-Seite darf kein noindex haben, Staging muss eines haben', () => {
  assert.ok(hasProblem(page(), /Live-Seite mit noindex/, { staging: false }));
  assert.deepEqual(checkHtml(page({ robots: '' }), { staging: false }), []);
  assert.ok(hasProblem(page({ robots: '' }), /ohne noindex/, { staging: true }));
});
test('Seite: Metadaten fehlen', () => {
  assert.ok(hasProblem(page({ title: '' }), /title fehlt/));
  assert.ok(hasProblem(page({ desc: '' }), /Description/));
  assert.ok(hasProblem(page({ desc: '<meta name="description" content="kurz">' }), /Description/));
  assert.ok(hasProblem(page({ canon: '' }), /Canonical/));
  assert.ok(hasProblem(page({ canon: '<link rel="canonical" href="https://x.de/seite">' }), /Canonical/));
  assert.ok(hasProblem(page({ lang: 'en' }), /lang/));
});
test('Seite: Umami genau einmal und unverändert (data-domains darf github.io nicht enthalten)', () => {
  assert.ok(hasProblem(page({ umami: '' }), /genau 1x/));
  const one = `<script defer src="${UMAMI.src}" data-website-id="${UMAMI.websiteId}" data-domains="${UMAMI.domains}"></script>`;
  assert.ok(hasProblem(page({ umami: one + one }), /genau 1x/));
  assert.ok(hasProblem(page({ umami: one.replace('mitrilmo.com,www.mitrilmo.com', 'mitrilmo.github.io') }), /weicht von der Vorgabe ab/));
  assert.ok(hasProblem(page({ umami: one.replace(UMAMI.websiteId, 'andere-id') }), /weicht von der Vorgabe ab/));
  assert.ok(hasProblem(page({ umami: one.replace('defer ', '') }), /weicht von der Vorgabe ab/));
});
test('Seite: iFrame, YouTube-Einbettung, Thumbnail-Fallback, Tailwind-CDN und Google Fonts sind verboten', () => {
  for (const body of ['<iframe src="x"></iframe>', '<a href="https://www.youtube.com/embed/x">v</a>', '<img src="/a.jpg" onerror="this.src=\'https://img.youtube.com/vi/x/0.jpg\'">']) {
    assert.ok(hasProblem(page({ body }), /Verbotener Bestandteil/), body);
  }
  assert.ok(hasProblem(page({ head: '<script src="https://cdn.tailwindcss.com"></script>' }), /Verbotener Bestandteil/));
  assert.ok(hasProblem(page({ head: '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">' }), /Verbotener Bestandteil/));
});
test('Seite: externe Anfragen beim Laden sind Fehler, normale Links nach außen nicht', () => {
  assert.ok(hasProblem(page({ head: '<script src="https://example.org/x.js"></script>' }), /Externe Anfrage/));
  assert.ok(hasProblem(page({ body: '<img src="https://example.org/a.jpg">' }), /Externe Anfrage/));
  assert.ok(hasProblem(page({ head: '<link rel="stylesheet" href="https://example.org/a.css">' }), /Externe Anfrage/));
  assert.ok(hasProblem(page({ head: '<style>@font-face{src:url(https://example.org/f.woff2)}</style>' }), /Externe Anfrage/));
  assert.deepEqual(checkHtml(page({ body: '<a href="https://www.youtube.com/@mitrilmo">YouTube</a>' }), { staging: true }), []);
});

// --- Links ---
const files = new Set(['index.html', 'stories/test.html', '404.html', 'gpx/a.gpx']);
const links = (pagesObj, base = '/mitrilmo-staging') => checkLinks(new Map(Object.entries(pagesObj)), base, (r) => files.has(r));

test('Links: gültige interne Links, Hash-Anker, Endung optional', () => {
  const html = '<a href="/mitrilmo-staging/">s</a><a href="/mitrilmo-staging/#impressum">i</a><a href="/mitrilmo-staging/stories/test.html">t</a><a href="/mitrilmo-staging/stories/test">t</a><a href="/mitrilmo-staging/gpx/a.gpx">g</a><a href="mailto:a@b.de">m</a><a href="#oben">o</a><a href="https://example.org">e</a>';
  assert.deepEqual(links({ 'index.html': html }), []);
});
test('Links: toter Link und Link ohne Basispfad werden gefunden', () => {
  const r = links({ 'index.html': '<a href="/mitrilmo-staging/gibts-nicht.html">x</a><a href="/touren.html">y</a>' });
  assert.equal(r.length, 2);
  assert.ok(r.some((p) => /toter Link/.test(p)));
  assert.ok(r.some((p) => /ohne Basispfad/.test(p)));
});
test('Links: ohne Basispfad (Live) und relative Links', () => {
  assert.deepEqual(links({ 'stories/test.html': '<a href="../index.html">z</a><a href="/stories/test.html">s</a>' }, ''), []);
  assert.equal(links({ 'index.html': '<a href="/nope.html">x</a>' }, '').length, 1);
});

// --- Impressum und Datenschutz (Modals auf der Startseite) ---
const footer = '<footer><a href="/mitrilmo-staging/#impressum">Impressum</a><a href="/mitrilmo-staging/#datenschutz">Datenschutz</a></footer>';
const modal = (id, title, text, cls = 'hidden') => `<div id="modal-${id}" role="dialog" aria-modal="true" aria-labelledby="modal-${id}-title" class="x ${cls}"><h2 id="modal-${id}-title">${title}</h2><div>${text}</div></div>`;
const homeHtml = (over = {}) => `<head><script>function resolveHash(){}</script></head><body>${footer}${over.imp ?? modal('impressum', 'Impressum', 'Angaben gemäß § 5 DDG kontakt-impressum@mitrilmo.com')}${over.ds ?? modal('datenschutz', 'Datenschutzerklärung', 'Hosting bei GitHub Pages, Messung mit Umami')}</body>`;
const legal = (home, other = footer) => checkLegal(new Map([['index.html', home], ['404.html', other]]));

test('Rechtliches: gültige Startseite mit beiden Modals und Footer-Links', () => {
  assert.deepEqual(legal(homeHtml()), []);
});
test('Rechtliches: Footer-Links auf /#impressum und /#datenschutz fehlen auf einer Seite', () => {
  const p = legal(homeHtml(), '<footer><a href="/mitrilmo-staging/#impressum">I</a></footer>');
  assert.ok(p.some((x) => /404\.html: Footer-Link auf \/#datenschutz fehlt/.test(x)), JSON.stringify(p));
});
test('Rechtliches: Modal fehlt, nicht ausgeblendet, ohne Dialog-Attribute, falscher Titel oder fehlender Text', () => {
  assert.ok(legal(homeHtml({ imp: '' })).some((x) => /Modal impressum fehlt/.test(x)));
  assert.ok(legal(homeHtml({ ds: modal('datenschutz', 'Datenschutzerklärung', 'GitHub Pages Umami', 'flex') })).some((x) => /nicht ausgeblendet/.test(x)));
  assert.ok(legal(homeHtml({ ds: '<div id="modal-datenschutz" class="hidden"><h2 id="modal-datenschutz-title">Datenschutzerklärung</h2>GitHub Pages Umami</div>' })).some((x) => /ohne role="dialog"/.test(x)));
  assert.ok(legal(homeHtml({ imp: modal('impressum', 'Kontakt', '§ 5 DDG kontakt-impressum@mitrilmo.com') })).some((x) => /Titel „Impressum"/.test(x)));
  assert.ok(legal(homeHtml({ imp: modal('impressum', 'Impressum', 'nur ein Satz') })).some((x) => /enthält „§ 5 DDG" nicht/.test(x)));
});
test('Rechtliches: Anker-Skript im Head der Startseite ist Pflicht', () => {
  assert.ok(legal(homeHtml().replace('function resolveHash(){}', '')).some((x) => /resolveHash/.test(x)));
});

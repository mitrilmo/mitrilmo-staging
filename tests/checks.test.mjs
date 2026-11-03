import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEntries, checkHtml, checkLinks, checkLegal, checkDistImages, checkSitemap, gpxLengthKm, UMAMI } from '../scripts/lib/checks.mjs';
import { sitemapUrls, sitemapXml, robotsTxt } from '../src/lib/sitemap.js';

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
const okImage = { bytes: 400000, width: 1600, height: 900, gps: false };
const io = (missing = [], km = 10, image = okImage) => ({
  exists: (p) => !missing.includes(p),
  gpxKm: () => km,
  image: (p) => (missing.includes(p) ? null : image), // Bild: null = Datei fehlt
});
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
const OG_OK = '<meta property="og:title" content="Start"><meta property="og:description" content="Eine ausreichend lange Beschreibung der Seite."><meta property="og:url" content="https://mitrilmo.github.io/mitrilmo-staging/index.html"><meta property="og:image" content="https://mitrilmo.github.io/mitrilmo-staging/images/channel-logo.jpg">';
const page = ({ title = '<title>Start</title>', desc = '<meta name="description" content="Eine ausreichend lange Beschreibung der Seite.">', canon = '<link rel="canonical" href="https://mitrilmo.github.io/mitrilmo-staging/index.html">', umami, robots = '<meta name="robots" content="noindex, nofollow">', og = OG_OK, head = '', body = '', main = '<main><h1>T</h1></main>', lang = 'de' } = {}) => {
  const u = umami ?? `<script defer src="${UMAMI.src}" data-website-id="${UMAMI.websiteId}" data-domains="${UMAMI.domains}"></script>`;
  return `<!doctype html><html lang="${lang}"><head>${title}${desc}${canon}${og}${robots}${head}${u}</head><body>${main}${body}</body></html>`;
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
test('Seite: Open Graph ist Pflicht, Bild absolut, og:url gleich Canonical', () => {
  assert.ok(hasProblem(page({ og: '' }), /og:title fehlt/));
  assert.ok(hasProblem(page({ og: '' }), /og:image fehlt/));
  assert.ok(hasProblem(page({ og: OG_OK.replace('https://mitrilmo.github.io/mitrilmo-staging/images', '/images') }), /absolute https-Adresse/));
  assert.ok(hasProblem(page({ og: OG_OK.replace('index.html"><meta property="og:image', 'x.html"><meta property="og:image') }), /weicht vom Canonical ab/));
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

// --- Bilder (AP1.6) ---
const imgErrs = (image, imageName = 'images/a.jpg') => checkEntries(baseData(), io([], 10, image)).errors.filter((e) => /image|thumbnail/.test(e));
const imgWarns = (image) => checkEntries(baseData(), io([], 10, image)).warnings.filter((w) => /Original/.test(w));

test('Bilder: Original zu groß, zu schmal oder mit GPS ist ein Fehler', () => {
  assert.deepEqual(imgErrs(okImage), []);
  assert.ok(imgErrs({ ...okImage, bytes: 9 * 1048576 }).some((e) => /MB groß/.test(e)));
  assert.ok(imgErrs({ ...okImage, width: 600 }).some((e) => /nur 600 px breit/.test(e)));
  assert.ok(imgErrs({ ...okImage, gps: true }).some((e) => /GPS-Koordinaten/.test(e)));
});
test('Bilder: zwischen 3 und 8 MB nur ein Hinweis', () => {
  assert.deepEqual(imgErrs({ ...okImage, bytes: 4 * 1048576 }), []);
  assert.ok(imgWarns({ ...okImage, bytes: 4 * 1048576 }).length > 0);
});
test('Bilder im HTML: alt, width und height sind Pflicht, leerer Alt-Text nur dekorativ', () => {
  const ok = '<img src="/a.webp" alt="Wandergruppe vor drei Türmen" width="1600" height="900" loading="lazy">';
  assert.deepEqual(checkHtml(page({ body: ok }), { staging: true }), []);
  assert.ok(hasProblem(page({ body: '<img src="/a.webp" width="1" height="1">' }), /ohne alt-Attribut/));
  assert.ok(hasProblem(page({ body: '<img src="/a.webp" alt="" width="1" height="1">' }), /leerem Alt-Text/));
  assert.ok(hasProblem(page({ body: '<img src="/a.webp" alt="x">' }), /ohne width und height/));
  assert.deepEqual(checkHtml(page({ body: '<img src="/a.webp" alt="" role="presentation" width="1" height="1">' }), { staging: true }), []);
});
test('Bilder im Build: zu große ausgelieferte Dateien werden gefunden, Favicons nicht', () => {
  const mk = (path, kb) => ({ path, bytes: kb * 1024 });
  assert.deepEqual(checkDistImages([mk('_astro/a.webp', 300), mk('_astro/b.avif', 449), mk('favicon-32x32.png', 900)]), []);
  const p = checkDistImages([mk('_astro/gross.webp', 460), mk('_astro/riesig.jpeg', 2500)]);
  assert.equal(p.length, 2);
  assert.ok(p.every((x) => /zu groß/.test(x)));
});

// --- Fremdanfragen: Gegenprobe statt Aufzählung (Review M1) ---
import { externalProblems, checkCss, checkRobots } from '../scripts/lib/checks.mjs';
const ext = (html) => externalProblems(html);
const flagged = (html) => ext(html).length > 0;

test('Fremdanfragen: alle Wege nach außen werden gefunden', () => {
  const cases = {
    'srcset': '<img src="/a.jpg" alt="x" width="1" height="1" srcset="https://example.org/a.jpg 480w, /b.jpg 800w">',
    'poster': '<video poster="https://example.org/p.jpg"></video>',
    'object': '<object data="https://example.org/x.swf"></object>',
    'preconnect': '<link rel="preconnect" href="https://example.org">',
    'dns-prefetch': '<link rel="dns-prefetch" href="//example.org">',
    'preload': '<link rel="preload" href="https://example.org/f.woff2" as="font">',
    'protokollrelativ': '<script src="//example.org/x.js"></script>',
    'Großbuchstaben': '<SCRIPT SRC="https://example.org/x.js"></SCRIPT>',
    'einfache Anführungszeichen': "<img src='https://example.org/a.jpg' alt='x' width='1' height='1'>",
    'ohne Anführungszeichen': '<img src=https://example.org/a.jpg alt=x width=1 height=1>',
    'form': '<form action="https://example.org/senden"></form>',
    'css @import ohne url()': '<style>@import "https://example.org/a.css";</style>',
    'css url()': '<style>.a{background:url(https://example.org/a.png)}</style>',
    'css @font-face //': '<style>@font-face{src:url(//example.org/f.woff2)}</style>',
    'inline-Skript fetch': '<script>fetch("https://example.org/api")</script>',
    'iframe-Quelle': '<iframe src="https://example.org"></iframe>',
    'fremdes Skript mit anderer Umami-Domain': '<script defer src="https://mobrain.example.net/script.js"></script>',
  };
  for (const [name, html] of Object.entries(cases)) assert.ok(flagged(html), name);
});
test('Fremdanfragen: erlaubte Fälle werden nicht beanstandet', () => {
  const allowed = [
    '<a href="https://www.youtube.com/@mitrilmo">YouTube</a>',
    '<A HREF="https://www.instagram.com/mitrilmo/">I</A>',
    '<link rel="canonical" href="https://www.mitrilmo.com/index.html">',
    '<link rel="alternate" href="https://www.mitrilmo.com/rss.xml">',
    '<meta property="og:image" content="https://www.mitrilmo.com/og.jpg">',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>',
    '<script type="application/ld+json">{"@context":"https://schema.org"}</script>',
    '<style>/* tailwindcss v4 | https://tailwindcss.com */ .a{color:red}</style>',
    '<p>Mehr Infos unter https://3tuermeweg.de/die-tuerme im Text, nicht anklickbar.</p>',
    '<img src="/mitrilmo-staging/_astro/a.avif" srcset="/mitrilmo-staging/_astro/a.avif 480w" alt="x" width="1" height="1">',
    `<script defer src="${UMAMI.src}" data-website-id="${UMAMI.websiteId}" data-domains="${UMAMI.domains}"></script>`,
  ];
  for (const html of allowed) assert.deepEqual(ext(html), [], html);
});
test('CSS-Dateien: externe Adressen werden gefunden, Kommentare nicht', () => {
  assert.equal(checkCss('/*! tailwindcss | https://tailwindcss.com */ .a{color:red}').length, 0);
  assert.equal(checkCss('@import "https://example.org/a.css"; .a{background:url(//example.org/a.png)}').length, 2);
  assert.equal(checkCss('.a{background:url(/mitrilmo-staging/fonts/x.woff2)}').length, 0);
});
test('Umami: zusätzliche Attribute werden gefunden', () => {
  const one = `<script defer src="${UMAMI.src}" data-website-id="${UMAMI.websiteId}" data-domains="${UMAMI.domains}" data-auto-track="false"></script>`;
  assert.ok(hasProblem(page({ umami: one }), /zusätzliche Attribute: data-auto-track/));
});
test('robots.txt: Live darf nicht komplett gesperrt sein, Staging egal', () => {
  assert.deepEqual(checkRobots('User-agent: *\nDisallow: /\n', true), []);
  assert.equal(checkRobots('User-agent: *\nDisallow: /\n', false).length, 1);
  assert.equal(checkRobots('User-agent: *\r\nDisallow: /  \r\n', false).length, 1);
  assert.deepEqual(checkRobots('User-agent: *\nDisallow: /dev-bilder.html\nSitemap: https://www.mitrilmo.com/sitemap.xml\n', false), []);
  assert.deepEqual(checkRobots('User-agent: *\nDisallow:\n', false), []);
});

// --- Neuigkeiten (news) ---
test('Neuigkeiten: Titelbild, Fotos und Tour werden geprüft', () => {
  const d = baseData();
  d.news = { '2026-10-31-test': { cover: 'images/c.jpg', photos: [{ image: 'images/p1.jpg' }], tour: 'heilenbecke-talsperre' } };
  assert.deepEqual(errs(d, io()), []);
  assert.ok(errs(d, io(['images/c.jpg'])).some((e) => /news\/2026-10-31-test: cover verweist auf eine Datei/.test(e)));
  assert.ok(errs(d, io(['images/p1.jpg'])).some((e) => /photos\[0\]/.test(e)));
  d.news['2026-10-31-test'].tour = 'keine-tour';
  assert.ok(errs(d, io()).some((e) => /Tour keine-tour gibt es nicht/.test(e)));
  d.news['Falscher_Slug'] = d.news['2026-10-31-test'];
  assert.ok(errs(d, io()).some((e) => /news\/Falscher_Slug: Dateiname ist kein gültiger Slug/.test(e)));
});
test('Neuigkeiten: GPS in einem Foto ist ein Fehler', () => {
  const d = baseData();
  d.news = { '2026-10-31-test': { cover: 'images/c.jpg', photos: [{ image: 'images/p1.jpg' }] } };
  assert.ok(errs(d, io([], 10, { ...okImage, gps: true })).some((e) => /GPS/.test(e)));
});
test('Inhalte: Video braucht Vorschaubild, Short ein Datum', () => {
  const d = baseData(); delete d.videos.k1JNFJuXz7o.thumbnail;
  assert.ok(errs(d, io()).some((e) => /Vorschaubild/.test(e)));
  const s = baseData(); s.videos._A4uDbxSqSI = { youtubeId: '_A4uDbxSqSI', format: 'short' };
  assert.ok(errs(s, io()).some((e) => /Short braucht ein Datum/.test(e)));
  const ok = baseData(); ok.videos._A4uDbxSqSI = { youtubeId: '_A4uDbxSqSI', format: 'short', publishedAt: '2026-08-01' };
  assert.ok(!errs(ok, io()).some((e) => /_A4uDbxSqSI/.test(e)));
});

// --- Sitemap und robots.txt (nur Live) ---
const SITE = 'https://www.mitrilmo.com';
const htmlFiles = ['index.html', '404.html', 'touren.html', 'touren/a.html', 'stories/test.html', 'dev-bilder.html'];

test('Sitemap: enthält Startseite als /index.html (wie der Canonical) und alle Seiten, aber nicht 404, dev-* und Testseiten', () => {
  assert.deepEqual(sitemapUrls(htmlFiles, SITE), [`${SITE}/index.html`, `${SITE}/touren.html`, `${SITE}/touren/a.html`]);
});
test('Sitemap: Sonderzeichen werden maskiert', () => {
  assert.match(sitemapXml(['https://x.de/a&b.html']), /a&amp;b\.html/);
});
test('Sitemap: passende Sitemap und robots.txt sind in Ordnung', () => {
  const urls = sitemapUrls(htmlFiles, SITE);
  assert.deepEqual(checkSitemap(sitemapXml(urls), robotsTxt(SITE), htmlFiles, SITE), []);
});
test('Sitemap: fehlende Seite, überzählige Seite, fehlende Sitemap-Zeile und fehlende Dateien', () => {
  const urls = sitemapUrls(htmlFiles, SITE);
  const p = (xml, robots) => checkSitemap(xml, robots, htmlFiles, SITE).join(' | ');
  assert.match(p(sitemapXml(urls.slice(1)), robotsTxt(SITE)), /Sitemap enthält nicht/);
  assert.match(p(sitemapXml([...urls, `${SITE}/404.html`]), robotsTxt(SITE)), /ausgeschlossene Seite/);
  assert.match(p(sitemapXml(urls), 'User-agent: *\nAllow: /\n'), /robots\.txt ohne Zeile/);
  assert.match(p('', robotsTxt(SITE)), /sitemap\.xml fehlt/);
  assert.match(p(sitemapXml(urls), ''), /robots\.txt fehlt/);
});

test('Seite: genau eine h1, keine übersprungene Ebene, main vorhanden', () => {
  assert.ok(hasProblem(page({ main: '<main></main>' }), /genau eine h1 erwartet \(gefunden: 0\)/));
  assert.ok(hasProblem(page({ main: '<main><h1>a</h1><h1>b</h1></main>' }), /gefunden: 2/));
  assert.ok(hasProblem(page({ main: '<main><h1>a</h1><h3>b</h3></main>' }), /Sprung von h1 auf h3/));
  assert.ok(hasProblem(page({ main: '<h1>a</h1>' }), /Kein main/));
  assert.deepEqual(checkHtml(page({ main: '<main><h1>a</h1><h2>b</h2><h3>c</h3><h2>d</h2></main>' }), { staging: true }), []);
});

test('Sitemap: Windows-Pfade mit Backslash werden zu normalen Adressen', () => {
  assert.deepEqual(sitemapUrls(['touren\\a.html', 'stories\\test.html', 'dev-x.html'], SITE), [`${SITE}/touren/a.html`]);
});

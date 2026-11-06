// Prüfregeln für Inhalte und gebaute Seiten (AP1.4). Reine Funktionen, getestet in tests/checks.test.mjs.
// Ersetzen das alte verify.js der Live-Seite: Dateiende/JS-Syntax von index.html und Touren<->Pin-Abgleich entfallen
// (Pins entstehen aus Daten), neu sind Slugs, Dateien, Referenzen, GPX-Länge, Metadaten, Umami, Fremdanfragen, Links.
import { posix } from 'node:path';
import { parse } from 'yaml';
import { sitemapUrls } from '../../src/lib/sitemap.js';

export const UMAMI = {
  src: 'https://mobrain.tail4c30a8.ts.net/script.js',
  websiteId: 'b0279420-580a-4f86-99df-4ac427936c73',
  domains: 'mitrilmo.com,www.mitrilmo.com',
};
// Bildbudgets (AP1.6). Originale liegen in src/assets/images/, ausgeliefert werden die von Astro erzeugten Varianten.
export const IMAGE_BUDGET = {
  maxBytes: 8 * 1024 * 1024,  // Original darf nicht größer sein (Repo bleibt klein), Import-Skript verkleinert
  warnBytes: 3 * 1024 * 1024,
  minWidth: 800,              // kleinere Originale wirken auf großen Bildschirmen unscharf
  distMaxBytes: 450 * 1024,   // jede ausgelieferte Bilddatei (größte Variante, 1600 px); fängt Ausreißer im MB-Bereich ab
};
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const YT = /^[A-Za-z0-9_-]{11}$/;

export function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) throw new Error('Kein Frontmatter gefunden');
  return parse(m[1]) || {};
}

// Länge eines GPX-Tracks in km. Mehrere Abschnitte (trkseg) werden einzeln summiert, Lücken dazwischen zählen nicht.
export function gpxLengthKm(xml) {
  const segs = [...xml.matchAll(/<trkseg>([\s\S]*?)<\/trkseg>/g)].map((m) => m[1]);
  const parts = segs.length ? segs : [xml];
  const rad = (x) => (x * Math.PI) / 180;
  let km = 0;
  let points = 0;
  for (const part of parts) {
    const pts = [...part.matchAll(/<trkpt[^>]*?lat="([-\d.]+)"[^>]*?lon="([-\d.]+)"/g)].map((m) => ({ lat: +m[1], lon: +m[2] }));
    points += pts.length;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
      km += 2 * 6371 * Math.asin(Math.sqrt(h));
    }
  }
  return points >= 2 ? km : null;
}

// data: { tours:{id:fm}, videos:{}, stories:{}, events:{}, projects:{} }; io: { exists(relPathUnderPublic), gpxKm(relPath) }
export function checkEntries(data, io) {
  const errors = [];
  const warnings = [];
  const err = (c, id, msg) => errors.push(`${c}/${id}: ${msg}`);
  const warn = (c, id, msg) => warnings.push(`${c}/${id}: ${msg}`);
  const need = (c, id, field, rel) => {
    if (rel && !io.exists(rel)) err(c, id, `${field} verweist auf eine Datei, die es nicht gibt (${rel})`);
  };
  // Bilddatei: io.image(rel) liefert null (fehlt) oder { bytes, width, height, gps }
  const img = (c, id, field, rel) => {
    if (!rel) return;
    const i = io.image(rel);
    if (!i) return err(c, id, `${field} verweist auf eine Datei, die es nicht gibt (${rel})`);
    if (i.gps) err(c, id, `${field}: das Bild enthält GPS-Koordinaten in den Metadaten (mit scripts/import-image.mjs importieren, das entfernt sie)`);
    if (i.bytes > IMAGE_BUDGET.maxBytes) err(c, id, `${field}: Original ist ${(i.bytes / 1048576).toFixed(1)} MB groß (Grenze ${IMAGE_BUDGET.maxBytes / 1048576} MB), bitte mit scripts/import-image.mjs verkleinern`);
    else if (i.bytes > IMAGE_BUDGET.warnBytes) warn(c, id, `${field}: Original ist ${(i.bytes / 1048576).toFixed(1)} MB groß`);
    if (i.width < IMAGE_BUDGET.minWidth) err(c, id, `${field}: nur ${i.width} px breit (mindestens ${IMAGE_BUDGET.minWidth} px)`);
  };

  for (const [c, entries] of Object.entries(data)) {
    for (const id of Object.keys(entries)) {
      if (c === 'videos') {
        if (!YT.test(id)) err(c, id, 'Dateiname muss die 11-stellige YouTube-ID sein');
        else if (entries[id].youtubeId !== id) err(c, id, `youtubeId (${entries[id].youtubeId}) passt nicht zum Dateinamen`);
      } else if (!SLUG.test(id)) {
        err(c, id, 'Dateiname ist kein gültiger Slug (nur a-z, 0-9, Bindestrich)');
      }
    }
  }

  for (const [id, t] of Object.entries(data.tours || {})) {
    img('tours', id, 'image', t.image);
    need('tours', id, 'gpx', t.gpx);
    if (t.gpx && io.exists(t.gpx)) {
      const km = io.gpxKm(t.gpx);
      if (km === null) err('tours', id, `GPX nicht lesbar oder ohne Trackpunkte (${t.gpx})`);
      else if (t.distanceKm && Math.abs(km - t.distanceKm) > Math.max(0.3, 0.15 * t.distanceKm)) {
        err('tours', id, `GPX misst ${km.toFixed(1)} km, Angabe ist ${t.distanceKm} km`);
      }
    }
    if (t.video && !(data.videos || {})[t.video]) err('tours', id, `Video ${t.video} gibt es nicht`);
    for (const s of t.stories || []) if (!(data.stories || {})[s]) err('tours', id, `Story ${s} gibt es nicht`);
    if (t.gpx && !t.coordinates) warn('tours', id, 'Koordinaten fehlen, kein Pin auf der Karte');
  }
  for (const [id, v] of Object.entries(data.videos || {})) {
    img('videos', id, 'thumbnail', v.thumbnail);
    if ((v.format ?? 'video') === 'video' && !v.thumbnail) err('videos', id, 'Video braucht ein lokales Vorschaubild');
    if (v.format === 'short' && !v.publishedAt) err('videos', id, 'Short braucht ein Datum');
  }
  for (const [id, s] of Object.entries(data.stories || {})) {
    img('stories', id, 'cover', s.cover);
    if (s.tour && !(data.tours || {})[s.tour]) err('stories', id, `Tour ${s.tour} gibt es nicht`);
  }
  for (const [id, n] of Object.entries(data.news || {})) {
    img('news', id, 'cover', n.cover);
    (n.photos || []).forEach((p, i) => img('news', id, `photos[${i}]`, p?.image));
    (n.sections || []).forEach((s, si) => (s?.photos || []).forEach((p, i) => img('news', id, `sections[${si}].photos[${i}]`, p?.image)));
    if (n.tour && !(data.tours || {})[n.tour]) err('news', id, `Tour ${n.tour} gibt es nicht`);
  }
  return { errors, warnings };
}

// Tags und Attribute: Groß-/Kleinschreibung egal, Werte in "..." oder '...' oder ohne Anführungszeichen
const ATTR = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const attrsOf = (s) => {
  const out = {};
  for (const m of s.matchAll(ATTR)) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
};
const tagsOf = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))].map((m) => attrsOf(m[1]));
const allTags = (html) => [...html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)].map((m) => ({ name: m[1].toLowerCase(), attrs: attrsOf(m[2]) }));
const isExternal = (u) => /^https?:\/\//i.test(u);
const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

// Externe Adressen in einem Text: http(s)://host oder protokollrelativ //host
const EXT_URL = /(?:https?:)?\/\/[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?::\d+)?(?:\/[^\s"'<>(),]*)?/gi;
export const externalUrls = (text) => [...text.matchAll(EXT_URL)].map((m) => m[0]);

// Fremdanfragen beim Laden: Gegenprobe statt Aufzählung. JEDE externe Adresse in einem Tag-Attribut, in <style> oder in einem
// Inline-Skript ist ein Fehler, außer: anklickbare Links (<a href>), Canonical/alternate, Meta-Inhalte, xmlns, JSON-LD
// und das Umami-Skript. Text zwischen den Tags zählt nicht (da stehen nur Anzeigetexte).
export function externalProblems(html) {
  const problems = [];
  const umamiHost = new URL(UMAMI.src).host;
  const hostOf = (u) => { try { return new URL(u.startsWith('//') ? 'https:' + u : u).host; } catch { return u; } };
  const flag = (where, u) => problems.push(`Externe Anfrage beim Laden (${where}): ${u}`);
  for (const t of allTags(html)) {
    for (const [attr, val] of Object.entries(t.attrs)) {
      if (!val) continue;
      if (attr === 'xmlns' || attr.startsWith('xmlns:')) continue;
      if (t.name === 'a' && attr === 'href') continue;
      if (t.name === 'link' && attr === 'href' && /^(canonical|alternate|author|me|license)$/i.test(t.attrs.rel || '')) continue;
      if (t.name === 'meta' && attr === 'content') continue;
      if (t.name === 'script' && attr === 'src' && hostOf(val) === umamiHost) continue;
      for (const u of externalUrls(val)) flag(`${t.name}[${attr}]`, u);
    }
  }
  for (const m of html.matchAll(/<(style|script)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const kind = m[1].toLowerCase();
    if (kind === 'script' && /ld\+json/i.test(attrsOf(m[2]).type || '')) continue;
    for (const u of externalUrls(kind === 'style' ? stripCssComments(m[3]) : m[3])) flag(kind, u);
  }
  return problems;
}

// Gebaute CSS-Dateien: keine externen Adressen (Kommentare ausgenommen)
export function checkCss(css, name = 'CSS') {
  return externalUrls(stripCssComments(css)).map((u) => `${name}: externe Adresse in der CSS-Datei: ${u}`);
}

// Prüft eine gebaute Seite. opts: { staging: boolean }
export function checkHtml(html, opts = { staging: true }) {
  const problems = [];
  if (!/<html[^>]*\blang="de"/i.test(html)) problems.push('html lang="de" fehlt');
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1];
  if (!title || !title.trim()) problems.push('title fehlt oder ist leer');
  const desc = tagsOf(html, 'meta').find((a) => a.name === 'description');
  if (!desc || (desc.content || '').trim().length < 20) problems.push('Meta Description fehlt oder ist zu kurz');
  const canon = tagsOf(html, 'link').find((a) => a.rel === 'canonical');
  if (!canon || !/^https:\/\/.+\.html$/.test(canon.href || '')) problems.push('Canonical fehlt oder zeigt nicht auf eine https-Adresse mit .html');

  // Open Graph: Link-Vorschauen (Messenger, soziale Netze) brauchen Titel, Beschreibung, Adresse und ein Bild mit absoluter https-Adresse
  const og = Object.fromEntries(tagsOf(html, 'meta').filter((a) => a.property?.startsWith('og:')).map((a) => [a.property, a.content || '']));
  for (const key of ['og:title', 'og:description', 'og:url', 'og:image']) if (!og[key]?.trim()) problems.push(`${key} fehlt`);
  if (og['og:image'] && !/^https:\/\//.test(og['og:image'])) problems.push('og:image muss eine absolute https-Adresse sein');
  if (og['og:url'] && canon && og['og:url'] !== canon.href) problems.push('og:url weicht vom Canonical ab');

  const umami = tagsOf(html, 'script').filter((a) => (a.src || '').includes('mobrain.'));
  if (umami.length !== 1) problems.push(`Umami-Skript muss genau 1x vorkommen (gefunden: ${umami.length})`);
  else {
    const u = umami[0];
    if (u.src !== UMAMI.src || u['data-website-id'] !== UMAMI.websiteId || u['data-domains'] !== UMAMI.domains || !('defer' in u)) {
      problems.push('Umami-Zeile weicht von der Vorgabe ab (src, data-website-id, data-domains, defer)');
    }
    const extra = Object.keys(u).filter((k) => !['src', 'defer', 'data-website-id', 'data-domains'].includes(k));
    if (extra.length) problems.push(`Umami-Zeile hat zusätzliche Attribute: ${extra.join(', ')}`);
  }

  const noindex = tagsOf(html, 'meta').some((a) => a.name === 'robots' && /noindex/i.test(a.content || ''));
  if (opts.staging && !noindex) problems.push('Staging-Seite ohne noindex');
  if (!opts.staging && noindex) problems.push('Live-Seite mit noindex');

  for (const bad of ['<iframe', 'youtube.com/embed', 'youtube-nocookie.com', 'img.youtube.com', 'cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com']) {
    if (html.toLowerCase().includes(bad)) problems.push(`Verbotener Bestandteil: ${bad}`);
  }

  // Fremdanfragen beim Laden: nur das Umami-Skript darf extern sein
  // Bilder: alt, width und height sind Pflicht (Barrierefreiheit, kein Springen beim Laden), Alt darf nicht leer sein
  for (const a of tagsOf(html, 'img')) {
    const label = a.src || '(ohne src)';
    if (!('alt' in a)) problems.push(`Bild ohne alt-Attribut: ${label}`);
    else if (a.alt.trim() === '' && a.role !== 'presentation') problems.push(`Bild mit leerem Alt-Text (nur mit role="presentation" erlaubt): ${label}`);
    if (!a.width || !a.height) problems.push(`Bild ohne width und height (Layout springt beim Laden): ${label}`);
  }

  // Überschriften und Landmarken: genau eine h1, keine übersprungenen Ebenen, ein main-Bereich
  const visible = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
  const levels = [...visible.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  const h1s = levels.filter((l) => l === 1).length;
  if (h1s !== 1) problems.push(`Überschriften: genau eine h1 erwartet (gefunden: ${h1s})`);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) { problems.push(`Überschriften: Sprung von h${levels[i - 1]} auf h${levels[i]}`); break; }
  }
  if (!/<main\b/i.test(visible)) problems.push('Kein main-Bereich');

  problems.push(...externalProblems(html));
  return problems;
}

// robots.txt: Die Live-Seite darf nicht komplett gesperrt sein. (Im Staging ist eine robots.txt im Unterpfad ohnehin wirkungslos,
// dort schützt nur der noindex-Meta-Tag.)
export function checkRobots(content, staging) {
  if (!staging && /^\s*Disallow:\s*\/\s*$/im.test(content || '')) return ['robots.txt sperrt die ganze Live-Seite (Disallow: /)'];
  return [];
}

// Live: robots.txt muss auf die Sitemap zeigen, die Sitemap muss genau die indexierbaren Seiten enthalten.
export function checkSitemap(sitemap, robots, htmlFiles, site) {
  const problems = [];
  if (!sitemap) return ['sitemap.xml fehlt im Live-Build'];
  const expected = sitemapUrls(htmlFiles, site);
  const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const u of expected) if (!listed.includes(u)) problems.push(`Sitemap enthält nicht: ${u}`);
  for (const u of listed) if (!expected.includes(u)) problems.push(`Sitemap enthält eine Adresse ohne Seite oder eine ausgeschlossene Seite: ${u}`);
  const want = `Sitemap: ${site.replace(/\/$/, '')}/sitemap.xml`;
  if (!robots) problems.push('robots.txt fehlt im Live-Build');
  else if (!robots.split(/\r?\n/).some((l) => l.trim() === want)) problems.push(`robots.txt ohne Zeile "${want}"`);
  return problems;
}

// files: [{ path, bytes }] des Builds. Jede ausgelieferte Bilddatei muss unter dem Budget bleiben.
export function checkDistImages(files) {
  return files
    .filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f.path) && !/^(favicon|apple-touch-icon)/i.test(f.path.split('/').pop()))
    .filter((f) => f.bytes > IMAGE_BUDGET.distMaxBytes)
    .map((f) => `Bild zu groß für die Auslieferung: ${f.path} (${Math.round(f.bytes / 1024)} KB, Grenze ${IMAGE_BUDGET.distMaxBytes / 1024} KB)`);
}

// Impressum und Datenschutz bleiben Modals auf der Startseite (Entscheidung Björn 30.10.2026).
// Jede Seite verlinkt im Footer auf /#impressum und /#datenschutz, die Startseite enthält beide Modals samt Text.
export function checkLegal(pages) {
  const problems = [];
  for (const [page, html] of pages) {
    const hrefs = tagsOf(html, 'a').map((a) => a.href || '');
    for (const id of ['impressum', 'datenschutz']) {
      if (!hrefs.some((h) => h.endsWith('/#' + id))) problems.push(`${page}: Footer-Link auf /#${id} fehlt`);
    }
  }
  const home = pages.get('index.html');
  if (!home) return problems;
  const rules = [
    ['impressum', 'Impressum', ['§ 5 DDG', 'kontakt-impressum@mitrilmo.com']],
    ['datenschutz', 'Datenschutzerklärung', ['GitHub Pages', 'Umami']],
  ];
  for (const [id, title, must] of rules) {
    const m = home.match(new RegExp(`<div id="modal-${id}"([^>]*)>`));
    if (!m) { problems.push(`index.html: Modal ${id} fehlt`); continue; }
    if (!/role="dialog"/.test(m[1]) || !/aria-modal="true"/.test(m[1]) || !new RegExp(`aria-labelledby="modal-${id}-title"`).test(m[1])) {
      problems.push(`index.html: Modal ${id} ohne role="dialog", aria-modal und aria-labelledby`);
    }
    if (!/\bhidden\b/.test((m[1].match(/class="([^"]*)"/) || [])[1] || '')) problems.push(`index.html: Modal ${id} ist nicht ausgeblendet`);
    if (!new RegExp(`<h2 id="modal-${id}-title"[^>]*>${title}</h2>`).test(home)) problems.push(`index.html: Titel „${title}" im Modal ${id} fehlt`);
    const body = home.slice(home.indexOf(`<div id="modal-${id}"`));
    for (const t of must) if (!body.includes(t)) problems.push(`index.html: Text im Modal ${id} enthält „${t}" nicht`);
  }
  if (!/function resolveHash/.test(home)) problems.push('index.html: Anker-Skript (resolveHash) fehlt im <head>');
  return problems;
}

// pages: Map(relPfad -> html); has(relPfad): gibt es die Datei im Build (Seiten und Assets)? base z. B. "/mitrilmo-staging" oder ""
export function checkLinks(pages, base, has) {
  const problems = [];
  for (const [page, html] of pages) {
    for (const a of tagsOf(html, 'a')) {
      const href = a.href;
      if (!href || isExternal(href) || /^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
      let p = href.split('#')[0].split('?')[0];
      if (p === '') continue;
      if (!p.startsWith('/')) { // relativ zur Seite, ../ wird aufgelöst
        p = posix.normalize('/' + page.replace(/[^/]*$/, '') + p);
      } else if (base) {
        if (!p.startsWith(base + '/') && p !== base) { problems.push(`${page}: interner Link ohne Basispfad ${base}: ${href}`); continue; }
        p = p.slice(base.length) || '/';
      }
      let rel = p.replace(/^\//, '');
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';
      const ok = has(rel) || (!/\.[a-z0-9]+$/i.test(rel) && has(rel + '.html'));
      if (!ok) problems.push(`${page}: toter Link ${href}`);
    }
  }
  return problems;
}

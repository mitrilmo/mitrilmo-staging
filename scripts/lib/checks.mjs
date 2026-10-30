// Prüfregeln für Inhalte und gebaute Seiten (AP1.4). Reine Funktionen, getestet in tests/checks.test.mjs.
// Ersetzen das alte verify.js der Live-Seite: Dateiende/JS-Syntax von index.html und Touren<->Pin-Abgleich entfallen
// (Pins entstehen aus Daten), neu sind Slugs, Dateien, Referenzen, GPX-Länge, Metadaten, Umami, Fremdanfragen, Links.
import { posix } from 'node:path';
import { parse } from 'yaml';

export const UMAMI = {
  src: 'https://mobrain.tail4c30a8.ts.net/script.js',
  websiteId: 'b0279420-580a-4f86-99df-4ac427936c73',
  domains: 'mitrilmo.com,www.mitrilmo.com',
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
    need('tours', id, 'image', t.image);
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
  for (const [id, v] of Object.entries(data.videos || {})) need('videos', id, 'thumbnail', v.thumbnail);
  for (const [id, s] of Object.entries(data.stories || {})) {
    need('stories', id, 'cover', s.cover);
    if (s.tour && !(data.tours || {})[s.tour]) err('stories', id, `Tour ${s.tour} gibt es nicht`);
  }
  return { errors, warnings };
}

const attrsOf = (s) => Object.fromEntries([...s.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)].map((m) => [m[1], m[2] ?? '']));
const tagsOf = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))].map((m) => attrsOf(m[1]));
const isExternal = (u) => /^https?:\/\//i.test(u);

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

  const umami = tagsOf(html, 'script').filter((a) => (a.src || '').includes('mobrain.'));
  if (umami.length !== 1) problems.push(`Umami-Skript muss genau 1x vorkommen (gefunden: ${umami.length})`);
  else {
    const u = umami[0];
    if (u.src !== UMAMI.src || u['data-website-id'] !== UMAMI.websiteId || u['data-domains'] !== UMAMI.domains || !('defer' in u)) {
      problems.push('Umami-Zeile weicht von der Vorgabe ab (src, data-website-id, data-domains, defer)');
    }
  }

  const noindex = tagsOf(html, 'meta').some((a) => a.name === 'robots' && /noindex/i.test(a.content || ''));
  if (opts.staging && !noindex) problems.push('Staging-Seite ohne noindex');
  if (!opts.staging && noindex) problems.push('Live-Seite mit noindex');

  for (const bad of ['<iframe', 'youtube.com/embed', 'img.youtube.com', 'cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com']) {
    if (html.toLowerCase().includes(bad)) problems.push(`Verbotener Bestandteil: ${bad}`);
  }

  // Fremdanfragen beim Laden: nur das Umami-Skript darf extern sein
  const umamiHost = new URL(UMAMI.src).host;
  const loads = [];
  for (const t of ['script', 'img', 'source', 'video', 'audio', 'embed', 'object']) for (const a of tagsOf(html, t)) if (a.src) loads.push(a.src);
  for (const a of tagsOf(html, 'link')) if (/^(stylesheet|preload|modulepreload|icon|apple-touch-icon|prefetch)$/i.test(a.rel || '') && a.href) loads.push(a.href);
  for (const m of html.matchAll(/url\(\s*['"]?(https?:\/\/[^'")\s]+)/gi)) loads.push(m[1]);
  for (const u of loads) {
    if (isExternal(u) && new URL(u).host !== umamiHost) problems.push(`Externe Anfrage beim Laden: ${u}`);
  }
  return problems;
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

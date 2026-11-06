// Momentwerk-Export "Für Website (ZIP)" lesen und prüfen (Format momentwerk-1, siehe Vault: Feature-Briefing-Website-Export-ZIP).
// Reine Funktionen, getestet in tests/blog-import.test.mjs. Das Schreiben übernimmt scripts/blog-import.mjs.
import { parse } from 'yaml';
import { unzipSync } from 'fflate';

const IMAGE_PATH = /^bilder\/(cover|\d{2})\.webp$/;
const IMAGE_LINE = /^!\[([^\]]*)\]\((bilder\/[^)\s]+)\)$/;

// Datum + Titel -> Slug (ä=ae, ö=oe, ü=ue, ß=ss), wie im Briefing festgelegt.
export function slugify(date, title) {
  const t = title.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${date}-${t}`;
}

// ZIP -> { files: Map<Pfad, Uint8Array> }. Fehlerhafte oder gefährliche Pfade (.., absolut, Backslash) brechen ab.
export function readZip(buffer) {
  let raw;
  try { raw = unzipSync(new Uint8Array(buffer)); } catch (e) { throw new Error('Keine gültige ZIP-Datei: ' + e.message); }
  const files = new Map();
  for (const [name, data] of Object.entries(raw)) {
    if (name.endsWith('/')) continue; // Ordnereintrag
    if (name.startsWith('/') || name.includes('\\') || name.split('/').includes('..')) throw new Error(`Unzulässiger Pfad in der ZIP: ${name}`);
    files.set(name, data);
  }
  return files;
}

// beitrag.md -> { meta, intro, sections: [{ heading, text, photos: [{ file, alt }] }] }
export function parseBeitrag(text) {
  const t = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const m = t.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('beitrag.md: kein Frontmatter gefunden');
  const meta = parse(m[1]) || {};
  const intro = [];
  const sections = [];
  let cur = null;
  const lines = m[2].split('\n');
  const flush = (s) => { s.text = s.text.join('\n').trim(); };
  for (const line of lines) {
    const h = line.match(/^## +(.+?)\s*$/);
    if (h) { cur = { heading: h[1], text: [], photos: [] }; sections.push(cur); continue; }
    const img = line.match(IMAGE_LINE);
    if (img) {
      if (!cur) throw new Error(`beitrag.md: Foto ${img[2]} steht vor dem ersten Abschnitt`);
      cur.photos.push({ file: img[2], alt: img[1].trim() });
      continue;
    }
    (cur ? cur.text : intro).push(line);
  }
  sections.forEach(flush);
  return { meta, intro: intro.join('\n').trim(), sections };
}

// Prüft Metadaten, Bildverweise und Dateien. Gibt Fehlerliste zurück (leer = in Ordnung).
export function validate({ meta, intro, sections }, files) {
  const errors = [];
  if (meta.format !== 'momentwerk-1') errors.push(`format ist "${meta.format}", erwartet momentwerk-1`);
  if (meta.id === undefined || meta.id === null || String(meta.id).trim() === '') errors.push('id fehlt');
  if (typeof meta.title !== 'string' || meta.title.trim().length < 3) errors.push('title fehlt oder ist zu kurz');
  const d = meta.date instanceof Date ? meta.date.toISOString().slice(0, 10) : String(meta.date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d))) errors.push('date fehlt oder ist kein ISO-Datum (JJJJ-MM-TT)');
  if (meta.cover !== 'bilder/cover.webp') errors.push('cover muss bilder/cover.webp sein');
  if (meta.rating !== undefined && !(Number.isInteger(meta.rating) && meta.rating >= 1 && meta.rating <= 5)) errors.push('rating muss eine ganze Zahl von 1 bis 5 sein');
  if (!intro) errors.push('Einleitung fehlt (Text vor dem ersten ## Abschnitt)');
  const used = new Set([meta.cover]);
  for (const s of sections) for (const p of s.photos) {
    if (!IMAGE_PATH.test(p.file) || p.file === 'bilder/cover.webp') errors.push(`Ungültiger Bildverweis: ${p.file}`);
    else if (!files.has(p.file)) errors.push(`Bild fehlt in der ZIP: ${p.file}`);
    if (used.has(p.file)) errors.push(`Bild mehrfach verwendet: ${p.file}`);
    used.add(p.file);
  }
  if (!files.has('bilder/cover.webp')) errors.push('bilder/cover.webp fehlt in der ZIP');
  for (const f of files.keys()) {
    if (f === 'beitrag.md') continue;
    if (!IMAGE_PATH.test(f)) errors.push(`Unerwartete Datei in der ZIP: ${f}`);
    else if (!used.has(f)) errors.push(`Bild wird in beitrag.md nicht verwendet: ${f}`);
  }
  if (!files.has('beitrag.md')) errors.push('beitrag.md fehlt in der ZIP');
  return errors;
}

// Eintrag für src/content/news bauen. imagePath(file) liefert den Bildpfad relativ zur Markdown-Datei (nach dem Import als JPG).
// Bildunterschrift = Alt-Text. Fehlt sie, gibt es einen schlichten Ersatz (siehe fallbackAlts), den man später von Hand verbessert.
export function buildEntry(parsed, imagePath) {
  const { meta, intro, sections } = parsed;
  const date = meta.date instanceof Date ? meta.date.toISOString().slice(0, 10) : String(meta.date);
  const fallbackAlts = [];
  let n = 0;
  const alt = (a, file) => {
    n += 1;
    if (a) return a;
    const fb = `${meta.title}, Foto ${n}`;
    fallbackAlts.push(file);
    return fb;
  };
  const data = {
    title: meta.title.trim(),
    date,
    cover: imagePath('bilder/cover.webp'),
    coverAlt: `Titelbild: ${meta.title.trim()}`,
    ...(meta.mood ? { mood: String(meta.mood) } : {}),
    ...(meta.weather ? { weather: String(meta.weather) } : {}),
    ...(meta.rating !== undefined ? { rating: meta.rating } : {}),
    sections: sections.map((s) => ({
      heading: s.heading,
      ...(s.text ? { text: s.text } : {}),
      photos: s.photos.map((p) => ({ image: imagePath(p.file), alt: alt(p.alt, p.file) })),
    })).map((s) => (s.photos.length ? s : { ...s, photos: undefined })),
    momentwerkId: String(meta.id),
  };
  return { data, body: intro, fallbackAlts };
}

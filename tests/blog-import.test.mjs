import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';
import { slugify, readZip, parseBeitrag, validate, buildEntry } from '../scripts/lib/blog-import.mjs';

const md = (extra = '', body) => `---
format: momentwerk-1
id: 23
title: Gasthaus zur Neyetalsperre
date: 2026-10-31
mood: Begeistert
weather: "Teilweise bewölkt, 14°C"
cover: bilder/cover.webp
rating: 5${extra}
---

Einleitung.

## Gasthaus zur Neyetalsperre

Erster Absatz.

Zweiter Absatz.

![](bilder/01.webp)
![Staumauer](bilder/02.webp)

## Fazit

Ende gut.
`;
const img = new Uint8Array([1, 2, 3]);
const goodFiles = () => new Map([['beitrag.md', strToU8(md())], ['bilder/cover.webp', img], ['bilder/01.webp', img], ['bilder/02.webp', img]]);
const check = (text, files) => validate(parseBeitrag(text), files);

test('Slug: Datum + Titel, Umlaute ersetzt', () => {
  assert.equal(slugify('2026-10-31', 'Gasthaus zur Neyetalsperre'), '2026-10-31-gasthaus-zur-neyetalsperre');
  assert.equal(slugify('2026-01-02', 'Größe: Ärger über Üble Öfen!'), '2026-01-02-groesse-aerger-ueber-ueble-oefen');
});
test('ZIP lesen: Ordnereinträge übersprungen, gefährliche Pfade abgelehnt', () => {
  const ok = readZip(zipSync({ 'beitrag.md': strToU8('x'), 'bilder/cover.webp': img }));
  assert.deepEqual([...ok.keys()].sort(), ['beitrag.md', 'bilder/cover.webp']);
  assert.throws(() => readZip(zipSync({ '../boese.txt': img })), /Unzulässiger Pfad/);
  assert.throws(() => readZip(new Uint8Array([1, 2, 3, 4])), /Keine gültige ZIP/);
});
test('beitrag.md: Einleitung, Abschnitte, Fotos mit und ohne Alt-Text', () => {
  const p = parseBeitrag(md());
  assert.equal(p.intro, 'Einleitung.');
  assert.deepEqual(p.sections.map((s) => s.heading), ['Gasthaus zur Neyetalsperre', 'Fazit']);
  assert.equal(p.sections[0].text, 'Erster Absatz.\n\nZweiter Absatz.');
  assert.deepEqual(p.sections[0].photos, [{ file: 'bilder/01.webp', alt: '' }, { file: 'bilder/02.webp', alt: 'Staumauer' }]);
  assert.equal(p.meta.weather, 'Teilweise bewölkt, 14°C');
  assert.equal(parseBeitrag(md().replace(/\n/g, '\r\n')).intro, 'Einleitung.');
});
test('Foto vor dem ersten Abschnitt ist ein Fehler', () => {
  assert.throws(() => parseBeitrag('---\nformat: momentwerk-1\n---\n![](bilder/01.webp)\n'), /vor dem ersten Abschnitt/);
});
test('Gültige ZIP: keine Fehler', () => {
  assert.deepEqual(check(md(), goodFiles()), []);
});
test('Prüfung: Pflichtfelder, Format, Bewertung', () => {
  const bad = (text) => check(text, goodFiles()).join(' | ');
  assert.match(bad(md().replace('format: momentwerk-1', 'format: x')), /format/);
  assert.match(bad(md().replace('id: 23\n', '')), /id fehlt/);
  assert.match(bad(md().replace('date: 2026-10-31', 'date: 31.10.2026')), /ISO-Datum/);
  assert.match(bad(md().replace('rating: 5', 'rating: 6')), /rating/);
  assert.match(bad(md().replace('cover: bilder/cover.webp', 'cover: bilder/01.webp')), /cover muss/);
  assert.match(bad(md().replace('Einleitung.\n', '')), /Einleitung fehlt/);
});
test('Prüfung: Bildverweise und Dateien müssen übereinstimmen', () => {
  const f1 = goodFiles(); f1.delete('bilder/02.webp');
  assert.match(check(md(), f1).join(' '), /Bild fehlt in der ZIP: bilder\/02.webp/);
  const f2 = goodFiles(); f2.set('bilder/03.webp', img);
  assert.match(check(md(), f2).join(' '), /nicht verwendet: bilder\/03.webp/);
  const f3 = goodFiles(); f3.delete('bilder/cover.webp');
  assert.match(check(md(), f3).join(' '), /cover.webp fehlt/);
  const f4 = goodFiles(); f4.set('notizen.txt', img);
  assert.match(check(md(), f4).join(' '), /Unerwartete Datei/);
  assert.match(check(md().replace('bilder/02.webp)', 'bilder/01.webp)'), goodFiles()).join(' '), /mehrfach/);
});
test('Eintrag: Felder, Platzhalter-Alt-Texte, Text unverändert, momentwerkId als Text', () => {
  const e = buildEntry(parseBeitrag(md()), (f) => 'p/' + f);
  assert.equal(e.data.momentwerkId, '23');
  assert.equal(e.data.cover, 'p/bilder/cover.webp');
  assert.equal(e.data.rating, 5);
  assert.equal(e.body, 'Einleitung.');
  assert.equal(e.data.sections[0].text, 'Erster Absatz.\n\nZweiter Absatz.');
  assert.equal(e.data.sections[0].photos[0].alt, 'Gasthaus zur Neyetalsperre, Foto 1');
  assert.equal(e.data.sections[0].photos[1].alt, 'Staumauer');
  assert.deepEqual(e.fallbackAlts, ['bilder/01.webp']);
  assert.equal(e.data.sections[1].photos, undefined); // Fazit ohne Fotos
});
test('Schema: Abschnitte mit Fotos, Alt-Text Pflicht', async () => {
  const { z } = await import('astro/zod');
  const { newsSchema } = await import('../src/schemas/news.js');
  const s = newsSchema({ reference: () => z.string(), image: () => z.string() });
  const base = { title: 'Gasthaus', date: '2026-10-31', cover: 'c.jpg', coverAlt: 'Titelbild' };
  assert.equal(s.safeParse({ ...base, momentwerkId: '23', sections: [{ heading: 'Fazit', text: 'Ende.' }, { heading: 'Fotos', photos: [{ image: 'p.jpg', alt: 'Staumauer' }] }] }).success, true);
  assert.equal(s.safeParse({ ...base, sections: [{ heading: 'Fotos', photos: [{ image: 'p.jpg' }] }] }).success, false);
  assert.deepEqual(s.parse(base).sections, []);
});

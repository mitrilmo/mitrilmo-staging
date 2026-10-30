import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'astro/zod';
import { slug, youtubeId, httpsUrl, localImage } from '../src/schemas/common.js';
import { tourSchema } from '../src/schemas/tour.js';
import { videoSchema } from '../src/schemas/video.js';
import { storySchema } from '../src/schemas/story.js';
import { eventSchema } from '../src/schemas/event.js';
import { projectSchema } from '../src/schemas/project.js';

// reference() gibt es nur im Astro-Build, hier genügt ein String
const ref = () => z.string();
const tour = tourSchema(ref);
const story = storySchema(ref);

const okTour = {
  title: 'Rund um die Heilenbecke Talsperre', place: 'Ennepetal',
  description: 'Rundweg Heilenbecke Talsperre mit Enten und frischer Luft.',
  distanceKm: 2.6, duration: '30-60 Minuten', difficulty: 'leicht',
  image: 'images/tours/heilenbecke-talsperre.jpg', imageAlt: 'Titelbild der Tour',
  publishedAt: '2026-06-07',
};
const bad = (schema, obj) => assert.equal(schema.safeParse(obj).success, false);
const ok = (schema, obj) => {
  const r = schema.safeParse(obj);
  assert.equal(r.success, true, r.success ? '' : JSON.stringify(r.error.issues.map((i) => i.path.join('.') + ': ' + i.message)));
  return r.data;
};

test('Slug: gültig und ungültig', () => {
  for (const s of ['3-tuerme-weg-hagen', 'altenberger-dom', 'a']) assert.equal(slug.safeParse(s).success, true, s);
  for (const s of ['Altenberger-Dom', 'dhünn-dom', 'tour_1', 'a--b', '-a', 'a-', 'a b', '']) assert.equal(slug.safeParse(s).success, false, s);
});

test('Hilfsprüfungen: YouTube-ID, https, Bildpfad', () => {
  assert.equal(youtubeId.safeParse('iw7wg-KqpSU').success, true);
  assert.equal(youtubeId.safeParse('zu-kurz').success, false);
  assert.equal(httpsUrl.safeParse('https://www.mitrilmo.com').success, true);
  assert.equal(httpsUrl.safeParse('http://www.mitrilmo.com').success, false);
  assert.equal(localImage.safeParse('images/tours/x.jpg').success, true);
  assert.equal(localImage.safeParse('https://img.youtube.com/vi/abc/maxresdefault.jpg').success, false);
});

test('Tour: gültiger Minimalfall, Standardwerte greifen', () => {
  const t = ok(tour, okTour);
  assert.equal(t.kind, 'tour');
  assert.equal(t.activity, 'wandern');
  assert.equal(t.familyFriendly, 'unbekannt');
  assert.deepEqual(t.refreshments, []);
});

test('Tour: Pflichtfelder fehlen oder sind falsch', () => {
  for (const f of ['title', 'place', 'description', 'duration', 'difficulty', 'image', 'imageAlt', 'publishedAt', 'distanceKm']) {
    const o = { ...okTour }; delete o[f]; bad(tour, o);
  }
  bad(tour, { ...okTour, difficulty: 'extrem' });
  bad(tour, { ...okTour, gpx: 'gpx/Heilenbecke.gpx' });
  bad(tour, { ...okTour, image: 'https://img.youtube.com/vi/x/maxresdefault.jpg' });
  bad(tour, { ...okTour, komoot: 'http://www.komoot.com/tour/1' });
  bad(tour, { ...okTour, coordinates: { lat: 5, lng: 7 } });
  bad(tour, { ...okTour, updatedAt: '2026-01-01' });
});

test('Ziel: ohne GPX und ohne Distanz gültig, mit GPX ungültig', () => {
  const ziel = { ...okTour, kind: 'ziel' }; delete ziel.distanceKm;
  ok(tour, ziel);
  bad(tour, { ...ziel, gpx: 'gpx/neuss.gpx' });
});

test('Video: ID, Titel und lokales Vorschaubild', () => {
  ok(videoSchema, { youtubeId: 'k1JNFJuXz7o', title: '3-Türme-Weg Hagen', thumbnail: 'images/k1JNFJuXz7o.jpg' });
  bad(videoSchema, { youtubeId: 'k1JNFJuXz7o', title: '3-Türme-Weg Hagen', thumbnail: 'https://img.youtube.com/vi/k1JNFJuXz7o/0.jpg' });
  bad(videoSchema, { youtubeId: 'kurz', title: 'x', thumbnail: 'images/x.jpg' });
});

test('Story: Beschreibung Pflicht, Titelbild braucht Alt-Text', () => {
  const s = { title: '3-Türme-Weg Hagen', description: 'Was für ein grandioser Wandertag am 23. August 2026!', date: '2026-08-23', category: 'unterwegs' };
  ok(story, s);
  bad(story, { ...s, description: 'kurz' });
  bad(story, { ...s, category: 'blog' });
  bad(story, { ...s, cover: 'images/x.jpg' });
  ok(story, { ...s, cover: 'images/x.jpg', coverAlt: 'Wandergruppe' });
});

test('Event: endDate ist Pflicht, Reihenfolge der Daten, nur https', () => {
  const e = { title: 'Herbstmarkt', endDate: '2026-10-04', url: 'https://example.org/termin' };
  ok(eventSchema, e);
  bad(eventSchema, { title: 'Herbstmarkt', url: 'https://example.org/termin' });
  bad(eventSchema, { ...e, startDate: '2026-10-05' });
  bad(eventSchema, { ...e, url: 'http://example.org/termin' });
});

test('Projekt: Fortschritt nur mit Datenquelle und Stand', () => {
  const p = { title: 'Wander-Challenge 2026', kind: 'challenge', description: 'Kilometerstand über das Jahr, Ziel 600 km.' };
  ok(projectSchema, p);
  const prog = { current: 548, goal: 600, unit: 'km', updatedAt: '2026-10-25', source: 'Von Hand gepflegt' };
  ok(projectSchema, { ...p, progress: prog });
  bad(projectSchema, { ...p, progress: { ...prog, source: undefined } });
  bad(projectSchema, { ...p, progress: { ...prog, updatedAt: undefined } });
  bad(projectSchema, { ...p, progress: { ...prog, current: 5000 } });
  bad(projectSchema, { ...p, links: [{ label: 'Seite', href: 'http://example.org' }] });
});

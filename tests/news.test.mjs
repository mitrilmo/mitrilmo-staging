import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'astro/zod';
import { newsSchema } from '../src/schemas/news.js';
import { teaser, published, isExternal } from '../src/lib/news.js';
import { dateDe } from '../src/lib/date.js';

const schema = newsSchema({ reference: () => z.string(), image: () => z.string() });
const okNews = {
  title: 'Gasthaus zur Neyetalsperre', date: '2026-10-31',
  cover: '../../assets/images/news/x.jpg', coverAlt: 'Blick auf die Staumauer',
};
const ok = (o) => { const r = schema.safeParse(o); assert.equal(r.success, true, r.success ? '' : JSON.stringify(r.error.issues)); return r.data; };
const bad = (o) => assert.equal(schema.safeParse(o).success, false, JSON.stringify(o));

test('Neuigkeit: Mindestangaben genügen, Voreinstellungen stimmen', () => {
  const d = ok(okNews);
  assert.deepEqual(d.photos, []);
  assert.deepEqual(d.tags, []);
  assert.equal(d.draft, false);
});
test('Neuigkeit: Titelbild und Alt-Text sind Pflicht, Fotos brauchen Alt-Text', () => {
  bad({ ...okNews, cover: undefined });
  bad({ ...okNews, coverAlt: undefined });
  bad({ ...okNews, coverAlt: 'ab' });
  ok({ ...okNews, photos: [{ image: 'p.jpg', alt: 'Foto vom Weg' }] });
  bad({ ...okNews, photos: [{ image: 'p.jpg' }] });
});
test('Neuigkeit: Bewertung 1 bis 5, Tags ohne Raute und Leerzeichen', () => {
  ok({ ...okNews, rating: 5, mood: 'Begeistert', weather: 'Teilweise bewölkt, 14°C' });
  bad({ ...okNews, rating: 0 }); bad({ ...okNews, rating: 6 }); bad({ ...okNews, rating: 4.5 });
  ok({ ...okNews, tags: ['Neyetalsperre', 'Wandern'] });
  bad({ ...okNews, tags: ['#Wandern'] }); bad({ ...okNews, tags: ['zwei Wörter'] });
});
test('Neuigkeit: Link nur https oder interne .html-Adresse', () => {
  ok({ ...okNews, link: { href: 'https://www.youtube.com/post/abc', text: 'Zum Beitrag' } });
  ok({ ...okNews, link: { href: '/pfadwerk.html', text: 'Mehr zu Pfadwerk' } });
  bad({ ...okNews, link: { href: 'http://example.org', text: 'Zum Beitrag' } });
  bad({ ...okNews, link: { href: 'pfadwerk.html', text: 'Mehr zu Pfadwerk' } });
  bad({ ...okNews, link: { href: '/../x.html', text: 'Zum Beitrag' } });
});

const entry = (date, extra = {}, body = '') => ({ id: date, body, data: { date: new Date(date), draft: false, ...extra } });
test('Neuigkeiten: neueste zuerst, Entwürfe fehlen', () => {
  const l = published([entry('2026-05-09'), entry('2026-07-22'), entry('2026-06-06', { draft: true })]);
  assert.deepEqual(l.map((e) => e.id), ['2026-07-22', '2026-05-09']);
});
test('Kurztext: description, sonst erster Absatz, an Wortgrenze gekürzt', () => {
  assert.equal(teaser(entry('2026-01-01', { description: 'Genau diese Beschreibung zählt.' }, 'Anderer Text')), 'Genau diese Beschreibung zählt.');
  assert.equal(teaser(entry('2026-01-01', {}, 'Erster Absatz.\n\nZweiter Absatz.')), 'Erster Absatz.');
  const lang = 'Wort '.repeat(60);
  const t = teaser(entry('2026-01-01', {}, lang), 50);
  assert.ok(t.length <= 50 && t.endsWith('…') && !t.includes('Wor…'), t);
});
test('Datum auf Deutsch und Linkart', () => {
  assert.equal(dateDe(new Date('2026-10-31')), '31. Oktober 2026');
  assert.equal(isExternal('https://www.youtube.com/x'), true);
  assert.equal(isExternal('/pfadwerk.html'), false);
});

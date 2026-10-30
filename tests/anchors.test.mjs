import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const resolveHash = new Function(readFileSync(new URL('../src/lib/anchors.js', import.meta.url), 'utf8') + '; return resolveHash;')();

test('#impressum und #datenschutz öffnen immer das Modal (kein Redirect), auch ohne fertige Seiten', () => {
  assert.deepEqual(resolveHash('#impressum', []), { type: 'modal', id: 'impressum' });
  assert.deepEqual(resolveHash('#datenschutz', []), { type: 'modal', id: 'datenschutz' });
  assert.deepEqual(resolveHash('#impressum', ['touren.html']), { type: 'modal', id: 'impressum' });
});

test('Inhaltsanker leiten nur auf Seiten weiter, die es schon gibt', () => {
  assert.equal(resolveHash('#touren', []), null);
  assert.deepEqual(resolveHash('#touren', ['touren.html']), { type: 'redirect', to: 'touren.html' });
  assert.equal(resolveHash('#videos', ['touren.html']), null);
});

test('Anker mit Unterziel behalten das Fragment', () => {
  assert.deepEqual(resolveHash('#weltreiseSection', ['geschichten.html']), { type: 'redirect', to: 'geschichten.html#archiv' });
  assert.deepEqual(resolveHash('#randnotizenSection', ['geschichten.html']), { type: 'redirect', to: 'geschichten.html#randnotizen' });
  assert.deepEqual(resolveHash('#shortsSection', ['videos.html']), { type: 'redirect', to: 'videos.html#shorts' });
});

test('Alle alten Anker aus dem URL-Inventar sind abgedeckt', () => {
  const all = ['touren.html', 'videos.html', 'geschichten.html', 'termine.html', 'ueber-mitrilmo.html'];
  for (const a of ['#touren', '#videos', '#shortsSection', '#wanderberichte', '#weltreiseSection', '#randnotizenSection', '#archiveSection', '#eventsSection', '#upcomingSection', '#ueber']) {
    assert.equal(resolveHash(a, all)?.type, 'redirect', a);
  }
});

test('Unbekannte, leere und fremde Anker passieren nichts', () => {
  for (const h of ['', '#', '#hero', '#irgendwas', '#Impressum', '#blogSlider']) assert.equal(resolveHash(h, ['touren.html']), null, h);
});

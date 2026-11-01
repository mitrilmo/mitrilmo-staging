import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPRUECHE, spruchFuer } from '../src/data/sprueche.js';

test('Sprüche: 30 Stück, jeder nicht leer und eindeutig', () => {
  assert.equal(SPRUECHE.length, 30);
  assert.equal(new Set(SPRUECHE).size, 30);
  assert.ok(SPRUECHE.every((s) => s.length > 10));
});

test('Spruch des Tages: wechselt je Tag, gleicher Tag gleicher Spruch, Zyklus nach 30 Tagen', () => {
  const a = spruchFuer(new Date(2026, 10, 1));
  assert.equal(a, spruchFuer(new Date(2026, 10, 1, 23, 59)));
  assert.notEqual(a, spruchFuer(new Date(2026, 10, 2)));
  assert.equal(a, spruchFuer(new Date(2026, 10, 31)));
});

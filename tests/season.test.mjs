import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const seasonFor = new Function(readFileSync(new URL('../src/lib/season.js', import.meta.url), 'utf8') + '; return seasonFor;')();

const cases = [
  [2026, 1, 1, 'winter'], [2026, 2, 28, 'winter'], [2028, 2, 29, 'winter'],
  [2026, 3, 1, 'fruehling'], [2026, 5, 31, 'fruehling'],
  [2026, 6, 1, 'sommer'], [2026, 8, 31, 'sommer'],
  [2026, 9, 1, 'herbst'], [2026, 11, 30, 'herbst'],
  [2026, 12, 1, 'winter'], [2026, 12, 31, 'winter'],
];

for (const [y, m, d, expected] of cases) {
  test(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ist ${expected}`, () => {
    assert.equal(seasonFor(new Date(y, m - 1, d, 12, 0, 0)), expected);
  });
}

test('Mitternacht an der Grenze: 1. Maerz 00:00 ist Fruehling, 28. Februar 23:59 ist Winter', () => {
  assert.equal(seasonFor(new Date(2026, 2, 1, 0, 0, 0)), 'fruehling');
  assert.equal(seasonFor(new Date(2026, 1, 28, 23, 59, 59)), 'winter');
});

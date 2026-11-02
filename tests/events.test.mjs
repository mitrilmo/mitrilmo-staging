import test from 'node:test';
import assert from 'node:assert/strict';
import { upcoming, rangeDe } from '../src/lib/events.js';

const ev = (title, start, end) => ({ data: { title, startDate: start ? new Date(start) : undefined, endDate: new Date(end) } });

test('upcoming: Endtag zählt noch, danach verschwindet der Eintrag', () => {
  const list = [ev('A', '2026-10-01', '2026-10-04'), ev('B', null, '2026-11-02'), ev('C', '2026-11-10', '2026-11-10')];
  assert.deepEqual(upcoming(list, new Date('2026-11-02T23:30:00Z')).map((e) => e.data.title), ['B', 'C']);
  assert.deepEqual(upcoming(list, new Date('2026-11-03T00:00:00Z')).map((e) => e.data.title), ['C']);
});

test('upcoming: sortiert nach Beginn, Einträge ohne Beginn nach Ende', () => {
  const list = [ev('Spät', '2026-12-01', '2026-12-02'), ev('Früh', '2026-11-05', '2026-11-05'), ev('Ohne', null, '2026-11-20')];
  assert.deepEqual(upcoming(list, new Date('2026-11-02T10:00:00Z')).map((e) => e.data.title), ['Früh', 'Ohne', 'Spät']);
});

test('rangeDe: ein Tag, Monat, Monatswechsel, Jahreswechsel', () => {
  const d = (s) => new Date(s);
  assert.equal(rangeDe(undefined, d('2026-10-04')), '4. Oktober 2026');
  assert.equal(rangeDe(d('2026-10-04'), d('2026-10-04')), '4. Oktober 2026');
  assert.equal(rangeDe(d('2026-10-01'), d('2026-10-04')), '1. bis 4. Oktober 2026');
  assert.equal(rangeDe(d('2026-10-30'), d('2026-11-02')), '30. Oktober bis 2. November 2026');
  assert.equal(rangeDe(d('2026-12-30'), d('2027-01-02')), '30. Dezember 2026 bis 2. Januar 2027');
});

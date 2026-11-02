import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGpx, thin, trackPaths, elevationPath, lengthClass, kmDe } from '../src/lib/tours.js';
import { project } from '../src/data/region-map.js';

const gpx = (pts) => `<gpx><trk><trkseg>${pts.map(([lat, lon, ele]) => `<trkpt lat="${lat}" lon="${lon}">${ele === undefined ? '' : `<ele>${ele}</ele>`}</trkpt>`).join('')}</trkseg></trk></gpx>`;

test('parseGpx: Länge, Anstieg und Abstieg mit Schwelle', () => {
  // Zwei Punkte rund 1,11 km auseinander, dazu ein Rauschen von 2 m (zählt nicht) und ein Anstieg von 20 m
  const r = parseGpx(gpx([[51, 7, 100], [51.0, 7.0, 102], [51.01, 7, 120], [51.02, 7, 110]]));
  assert.ok(Math.abs(r.distanceKm - 2.224) < 0.02);
  assert.equal(r.ascent, 20);
  assert.equal(r.descent, 10);
  assert.equal(r.minEle, 100);
  assert.equal(r.maxEle, 120);
});

test('parseGpx: ohne Höhenangaben keine Höhenwerte, zu wenige Punkte gibt null', () => {
  const r = parseGpx(gpx([[51, 7], [51.01, 7]]));
  assert.equal(r.ascent, null);
  assert.equal(r.maxEle, null);
  assert.equal(parseGpx(gpx([[51, 7]])), null);
  assert.equal(parseGpx('kein gpx'), null);
});

test('thin: behält Anfang und Ende', () => {
  const pts = Array.from({ length: 1000 }, (_, i) => ({ i }));
  const t = thin(pts, 50);
  assert.equal(t.length, 50);
  assert.equal(t[0].i, 0);
  assert.equal(t.at(-1).i, 999);
  assert.equal(thin(pts.slice(0, 10), 50).length, 10);
});

test('trackPaths und elevationPath: Pfade liegen in der Zeichenfläche', () => {
  const g = parseGpx(gpx([[51, 7, 100], [51.01, 7.01, 130], [51.02, 7.0, 110]]));
  const t = trackPaths(g);
  assert.match(t.route, /^M[\d.]+,[\d.]+ L/);
  for (const m of t.route.matchAll(/([\d.]+),([\d.]+)/g)) {
    assert.ok(+m[1] >= 0 && +m[1] <= t.width && +m[2] >= 0 && +m[2] <= t.height);
  }
  const e = elevationPath(g);
  assert.equal(e.minE, 100);
  assert.equal(e.maxE, 130);
  assert.equal(elevationPath(parseGpx(gpx([[51, 7], [51.01, 7]]))), null);
});

test('Längenklassen und Format', () => {
  assert.equal(lengthClass(8), 'kurz');
  assert.equal(lengthClass(8.1), 'mittel');
  assert.equal(lengthClass(15), 'mittel');
  assert.equal(lengthClass(16.4), 'lang');
  assert.equal(lengthClass(undefined), '');
  assert.equal(kmDe(16.4), '16,4 km');
});

test('Karte: Punkte aus der Region liegen auf der Fläche, weit entfernte nicht', () => {
  const dom = project({ lat: 51.055, lng: 7.133 });
  assert.ok(dom && dom.x > 40 && dom.x < 560 && dom.y > 20 && dom.y < 460);
  assert.equal(project({ lat: 51.48, lng: 6.78 }), null); // Neuss liegt außerhalb
});

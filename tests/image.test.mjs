import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { exifHasGps } from '../scripts/lib/exif.mjs';
import { importImage } from '../scripts/lib/image.mjs';

const dir = mkdtempSync(join(tmpdir(), 'mitrilmo-img-'));
const make = (name, w, h, exif) => {
  let p = sharp({ create: { width: w, height: h, channels: 3, background: { r: 70, g: 120, b: 60 } } });
  if (exif) p = p.withExif(exif);
  return p.jpeg().toFile(join(dir, name)).then(() => join(dir, name));
};
const GPS = { IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '51/1 15/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '7/1 22/1 0/1' } };

test('EXIF: GPS wird erkannt, Bild ohne EXIF und ohne GPS nicht', async () => {
  const withGps = await make('gps.jpg', 400, 300, GPS);
  const plain = await make('plain.jpg', 400, 300);
  const noGps = await make('nogps.jpg', 400, 300, { IFD0: { Copyright: 'mitrilmo' } });
  assert.equal(exifHasGps((await sharp(withGps).metadata()).exif), true);
  assert.equal(exifHasGps((await sharp(plain).metadata()).exif), false);
  assert.equal(exifHasGps((await sharp(noGps).metadata()).exif), false);
  assert.equal(exifHasGps(undefined), false);
  assert.equal(exifHasGps(Buffer.from('kein exif')), false);
});

test('Import: verkleinert auf die maximale Kantenlänge und entfernt GPS und alle Metadaten', async () => {
  const src = await make('gross.jpg', 3000, 2000, GPS);
  const out = join(dir, 'klein.jpg');
  const r = await importImage(src, out, { max: 2400 });
  assert.equal(r.width, 2400);
  assert.equal(r.height, 1600);
  assert.equal(r.hadGps, true);
  assert.equal(r.keptExif, false);
  assert.equal(exifHasGps((await sharp(out).metadata()).exif), false);
});

test('Import: kleine Bilder werden nicht vergrößert, Hochformat bleibt Hochformat', async () => {
  const klein = await make('k.jpg', 1000, 700);
  const r1 = await importImage(klein, join(dir, 'k-out.jpg'));
  assert.equal(r1.width, 1000);
  const hoch = await make('h.jpg', 2000, 3000);
  const r2 = await importImage(hoch, join(dir, 'h-out.jpg'), { max: 2400 });
  assert.equal(r2.height, 2400);
  assert.equal(r2.width, 1600);
});

test('Import: nicht unterstützte Dateiendung wird abgelehnt', async () => {
  const src = await make('x.jpg', 200, 200);
  await assert.rejects(() => importImage(src, join(dir, 'x.gif')), /nicht unterstützt/);
});

test.after(() => rmSync(dir, { recursive: true, force: true }));

test('Import: AVIF-Ziel verkleinert und entfernt GPS (Quellformat der Momentwerk-Beiträge)', async () => {
  const src = await make('fuer-avif.jpg', 3000, 2000, GPS);
  const dest = join(dir, 'ziel.avif');
  const r = await importImage(src, dest, { max: 1200, quality: 50 });
  const m = await sharp(dest).metadata();
  assert.equal(m.format, 'heif');
  assert.equal(Math.max(m.width, m.height), 1200);
  assert.equal(r.hadGps, true);
  assert.equal(r.keptExif, false);
});

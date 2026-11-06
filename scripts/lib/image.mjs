// Bild für den Neubau aufbereiten: Ausrichtung übernehmen, auf maximale Kantenlänge verkleinern, neu kodieren
// und dabei ALLE Metadaten entfernen (insbesondere GPS-Koordinaten). Das Original bleibt unverändert.
import sharp from 'sharp';
import { extname } from 'node:path';
import { exifHasGps } from './exif.mjs';

export async function importImage(srcPath, destPath, { max = 2400, quality = 85 } = {}) {
  const before = await sharp(srcPath).metadata();
  let pipe = sharp(srcPath).rotate().resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true });
  const ext = extname(destPath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') pipe = pipe.jpeg({ quality, mozjpeg: true });
  else if (ext === '.png') pipe = pipe.png({ compressionLevel: 9 });
  else if (ext === '.webp') pipe = pipe.webp({ quality });
  else if (ext === '.avif') pipe = pipe.avif({ quality, effort: 4 });
  else throw new Error(`Dateiendung ${ext} nicht unterstützt (jpg, png, webp, avif)`);
  await pipe.toFile(destPath); // ohne .withMetadata(): EXIF, GPS und Farbprofil-Zusatzdaten werden nicht übernommen
  const after = await sharp(destPath).metadata();
  return {
    width: after.width,
    height: after.height,
    hadGps: exifHasGps(before.exif),
    keptExif: Boolean(after.exif),
  };
}

// Erkennt GPS-Angaben in den EXIF-Daten eines Bildes (Tag 0x8825 im ersten Verzeichnis). Gibt nie Koordinaten aus.
export function exifHasGps(buf) {
  if (!buf || buf.length < 14) return false;
  let t = buf.indexOf('Exif\0\0');
  t = t >= 0 ? t + 6 : 0;
  const le = buf[t] === 0x49 && buf[t + 1] === 0x49;
  if (!le && !(buf[t] === 0x4d && buf[t + 1] === 0x4d)) return false;
  const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  try {
    const ifd = t + u32(t + 4);
    const n = u16(ifd);
    for (let i = 0; i < n; i++) if (u16(ifd + 2 + i * 12) === 0x8825) return true;
  } catch { /* abgeschnittene Daten */ }
  return false;
}

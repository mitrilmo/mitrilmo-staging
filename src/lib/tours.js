// Hilfen für die Touren-Seiten (AP3.1, AP3.2): Beschriftungen, Längenklassen und GPX-Auswertung beim Bauen.

export const difficultyLabel = {
  'sehr-leicht': 'Sehr leicht',
  leicht: 'Leicht',
  mittel: 'Mittel',
  schwer: 'Schwer',
};

export const activityLabel = { wandern: 'Wandern', radfahren: 'Radfahren', 'e-bike': 'E-Bike' };

export const seasonLabel = { fruehling: 'Frühling', sommer: 'Sommer', herbst: 'Herbst', winter: 'Winter' };

export const triLabel = { ja: 'Ja', nein: 'Nein' };

// Längenklassen für den Filter. Ziele ohne Strecke haben keine Klasse.
export const lengthClasses = [
  { id: 'kurz', label: 'bis 8 km', test: (km) => km <= 8 },
  { id: 'mittel', label: '8 bis 15 km', test: (km) => km > 8 && km <= 15 },
  { id: 'lang', label: 'über 15 km', test: (km) => km > 15 },
];

export function lengthClass(km) {
  if (typeof km !== 'number') return '';
  return lengthClasses.find((c) => c.test(km))?.id ?? '';
}

export const kmDe = (km) => `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(km)} km`;

const toRad = (d) => (d * Math.PI) / 180;

function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Start und Ziel liegen beieinander (Rundweg oder Hin und zurück): Abstand der Endpunkte unter 150 m.
export function isClosed(gpx) {
  return haversineKm(gpx.points[0], gpx.points[gpx.points.length - 1]) < 0.15;
}

// Liest Trackpunkte (lat, lon, optional ele) aus einer GPX-Datei. Gibt null zurück, wenn weniger als zwei Punkte da sind.
export function parseGpx(xml) {
  const points = [];
  for (const m of xml.matchAll(/<trkpt\s+([^>]*)>([\s\S]*?)<\/trkpt>/g)) {
    const lat = Number(m[1].match(/lat="([-\d.]+)"/)?.[1]);
    const lng = Number(m[1].match(/lon="([-\d.]+)"/)?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const ele = m[2].match(/<ele>([-\d.]+)<\/ele>/)?.[1];
    points.push({ lat, lng, ele: ele === undefined ? null : Number(ele) });
  }
  if (points.length < 2) return null;

  let dist = 0;
  let ascent = 0;
  let descent = 0;
  let last = null;
  const withDist = points.map((p, i) => {
    if (i > 0) dist += haversineKm(points[i - 1], p);
    // Höhenmeter mit kleiner Schwelle (3 m), damit das Messrauschen nicht mitzählt
    if (p.ele !== null) {
      if (last === null) last = p.ele;
      else if (Math.abs(p.ele - last) >= 3) {
        if (p.ele > last) ascent += p.ele - last;
        else descent += last - p.ele;
        last = p.ele;
      }
    }
    return { ...p, km: dist };
  });
  const eles = points.map((p) => p.ele).filter((e) => e !== null);
  return {
    points: withDist,
    distanceKm: dist,
    ascent: eles.length ? Math.round(ascent) : null,
    descent: eles.length ? Math.round(descent) : null,
    minEle: eles.length ? Math.round(Math.min(...eles)) : null,
    maxEle: eles.length ? Math.round(Math.max(...eles)) : null,
  };
}

// Auf höchstens n Punkte ausdünnen (gleichmäßig, Anfang und Ende bleiben).
export function thin(points, n = 240) {
  if (points.length <= n) return points;
  const out = [];
  for (let i = 0; i < n; i++) out.push(points[Math.round((i * (points.length - 1)) / (n - 1))]);
  return out;
}

const r1 = (v) => Math.round(v * 10) / 10;

// SVG-Pfade für Streckenverlauf (Breite w, Höhe h, Rand pad) und Höhenprofil.
export function trackPaths(gpx, { w = 600, h = 360, pad = 16 } = {}) {
  const pts = thin(gpx.points);
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const kx = Math.cos(toRad((minLat + maxLat) / 2));
  const spanX = Math.max((maxLng - minLng) * kx, 1e-6);
  const spanY = Math.max(maxLat - minLat, 1e-6);
  const scale = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY);
  const offX = (w - spanX * scale) / 2;
  const offY = (h - spanY * scale) / 2;
  const xy = (p) => ({ x: r1(offX + (p.lng - minLng) * kx * scale), y: r1(offY + (maxLat - p.lat) * scale) });
  const coords = pts.map(xy);
  const route = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  return { route, start: coords[0], end: coords[coords.length - 1], width: w, height: h };
}

export function elevationPath(gpx, { w = 600, h = 140, pad = 8 } = {}) {
  const pts = thin(gpx.points.filter((p) => p.ele !== null));
  if (pts.length < 2) return null;
  const minE = Math.min(...pts.map((p) => p.ele));
  const maxE = Math.max(...pts.map((p) => p.ele));
  const spanE = Math.max(maxE - minE, 10);
  const total = pts[pts.length - 1].km || 1;
  const xy = (p) => `${r1(pad + (p.km / total) * (w - 2 * pad))},${r1(h - pad - ((p.ele - minE) / spanE) * (h - 2 * pad))}`;
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xy(p)}`).join(' ');
  const area = `${line} L${r1(w - pad)},${h - pad} L${pad},${h - pad} Z`;
  return { line, area, width: w, height: h, minE: Math.round(minE), maxE: Math.round(maxE) };
}

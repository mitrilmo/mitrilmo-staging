// Gemeinsame Bausteine der Schemas. Regeln stehen auch in CLAUDE.md und in der Slug-Tabelle (Vault).
import { z } from 'astro/zod';

// Slug: nur a-z, 0-9, Bindestrich. Gilt für Dateinamen der Einträge (die ID ist der Dateiname).
export const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug nur aus a-z, 0-9 und Bindestrich');

// Unbekanntes bleibt "unbekannt" und wird nicht angezeigt (nichts erfinden).
export const triState = z.enum(['ja', 'nein', 'unbekannt']).default('unbekannt');

export const httpsUrl = z.url('Gültige URL erwartet').refine((u) => u.startsWith('https://'), 'Nur https-Adressen');

// Bilder: Astro prüft über image() im Schema, dass die Datei lokal existiert (src/assets/images/...).
// Fremde URLs sind damit nicht möglich, die Prüfungen zu Größe, Maßen und GPS stehen in scripts/check-content.mjs.

export const gpxPath = z.string().regex(/^gpx\/[a-z0-9-]+\.gpx$/, 'GPX-Pfad wie gpx/<slug>.gpx');

export const youtubeId = z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'YouTube-ID hat 11 Zeichen');

export const season = z.enum(['fruehling', 'sommer', 'herbst', 'winter']);

export const date = z.coerce.date();

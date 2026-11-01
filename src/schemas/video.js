// Video oder Short. Kein eigener Seitentyp: erscheint in der Mediathek und verlinkt auf YouTube (reiner Link, kein Embed).
// Dateiname des Eintrags = YouTube-ID (wird in der CI gegen youtubeId geprüft).
// Shorts haben kein Vorschaubild, sie erscheinen als Textkarten mit Datum.
import { z } from 'astro/zod';
import { youtubeId, date } from './common.js';

export const videoSchema = ({ image }) => z.object({
  youtubeId,
  title: z.string().min(3),
  format: z.enum(['video', 'short']).default('video'),
  description: z.string().optional(),
  thumbnail: image().optional(), // lokal unter src/assets/images/videos/, nie von img.youtube.com
  category: z.enum(['wandern', 'radfahren', 'ausflug', 'technik', 'reise', 'sonstiges']).default('ausflug'),
  publishedAt: date.optional(),
});
// Video braucht Vorschaubild, Short braucht Datum: geprüft in scripts/lib/checks.mjs.

// Video. Kein eigener Seitentyp: erscheint in der Mediathek und verlinkt auf YouTube (reiner Link, kein Embed).
// Dateiname des Eintrags = YouTube-ID (wird in der CI gegen youtubeId geprüft).
import { z } from 'astro/zod';
import { youtubeId, date } from './common.js';

export const videoSchema = ({ image }) => z.object({
  youtubeId,
  title: z.string().min(3),
  description: z.string().optional(),
  thumbnail: image(), // lokal unter src/assets/images/videos/, nie von img.youtube.com
  category: z.enum(['wandern', 'radfahren', 'ausflug', 'technik', 'reise', 'sonstiges']).default('ausflug'),
  publishedAt: date.optional(),
});

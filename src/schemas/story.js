// Story (Wanderbericht, Randnotiz, Archiv). Dateiname = bisheriger Dateiname der Story-Seite (URL bleibt).
import { z } from 'astro/zod';
import { date, youtubeId } from './common.js';

export const storySchema = ({ reference, image }) =>
  z
    .object({
      title: z.string().min(3),
      description: z.string().min(20, 'Beschreibung für die Suchmaschine zu kurz').max(300),
      date,
      category: z.enum(['unterwegs', 'randnotizen', 'archiv']),
      cover: image().optional(),
      coverAlt: z.string().min(3).optional(),
      tour: reference('tours').optional(),
      series: z.enum(['weltreise']).optional(), // gehört zu einer Reihe (Weltumrundung 2017)
      day: z.number().int().min(0).optional(), // Tag der Reise, Pflicht bei series
      video: youtubeId.optional(), // Kurzvideo, auf YouTube nicht gelistet: nur als Link, nie in der Mediathek
      draft: z.boolean().default(false),
    })
    .superRefine((s, ctx) => {
      if (s.series && s.day === undefined) {
        ctx.addIssue({ code: 'custom', path: ['day'], message: 'Eine Geschichte in einer Reihe braucht day' });
      }
      if (s.cover && !s.coverAlt) {
        ctx.addIssue({ code: 'custom', path: ['coverAlt'], message: 'Ein Titelbild braucht einen Alt-Text' });
      }
    });

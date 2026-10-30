// Story (Wanderbericht, Randnotiz, Archiv). Dateiname = bisheriger Dateiname der Story-Seite (URL bleibt).
import { z } from 'astro/zod';
import { date } from './common.js';

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
      draft: z.boolean().default(false),
    })
    .superRefine((s, ctx) => {
      if (s.cover && !s.coverAlt) {
        ctx.addIssue({ code: 'custom', path: ['coverAlt'], message: 'Ein Titelbild braucht einen Alt-Text' });
      }
    });

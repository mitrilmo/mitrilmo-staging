// Event der Region ("Demnächst in der Region"). endDate ist Pflicht: danach blendet die Seite den Eintrag aus.
import { z } from 'astro/zod';
import { httpsUrl, date } from './common.js';

export const eventSchema = z
  .object({
    title: z.string().min(3),
    startDate: date.optional(),
    endDate: date,
    location: z.string().optional(),
    url: httpsUrl,
    category: z.enum(['wandern', 'outdoor', 'rad', 'food', 'markt', 'sonstiges']).default('sonstiges'),
    description: z.string().optional(),
    note: z.string().optional(), // z. B. "Termin vor Besuch selbst gegenchecken"
  })
  .superRefine((e, ctx) => {
    if (e.startDate && e.startDate > e.endDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'endDate liegt vor startDate' });
    }
  });

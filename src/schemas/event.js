// Event der Region ("Demnächst in der Region") oder Vorhaben des Kanals ("Demnächst auf dem Kanal").
// endDate ist Pflicht: danach blendet die Seite den Eintrag aus. Unbekannte Angaben (Preis, Uhrzeit) bleiben leer.
import { z } from 'astro/zod';
import { httpsUrl, date } from './common.js';

export const eventSchema = z
  .object({
    title: z.string().min(3),
    scope: z.enum(['region', 'kanal']).default('region'), // kanal = eigenes Vorhaben von Mo, ohne Veranstalter-Link
    startDate: date.optional(),
    endDate: date,
    time: z.string().optional(), // z. B. "10:15 Uhr" oder "16–20 Uhr"
    location: z.string().optional(),
    price: z.string().optional(), // z. B. "Eintritt frei"
    url: httpsUrl.optional(), // Pflicht bei scope region
    category: z.enum(['wandern', 'outdoor', 'rad', 'food', 'markt', 'sonstiges']).default('sonstiges'),
    description: z.string().optional(),
    note: z.string().optional(), // z. B. "Termin vor Besuch selbst gegenchecken"
  })
  .superRefine((e, ctx) => {
    if (e.startDate && e.startDate > e.endDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'endDate liegt vor startDate' });
    }
    if (e.scope === 'region' && !e.url) {
      ctx.addIssue({ code: 'custom', path: ['url'], message: 'Ein Event der Region braucht einen Link zum Veranstalter' });
    }
  });

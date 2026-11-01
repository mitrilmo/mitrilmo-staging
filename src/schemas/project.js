// Projekt (Pfadwerk, Mo's Hike Quest, Wander-Challenge, Mammut- und Megamärsche).
// Fortschrittsanzeigen nur mit benannter Datenquelle und Stand-Datum (Regel aus dem Umsetzungsplan).
import { z } from 'astro/zod';
import { date } from './common.js';

const link = z.object({
  label: z.string().min(2),
  href: z.string().refine((h) => h.startsWith('https://') || h.startsWith('/'), 'https:// oder interner Pfad mit /'),
});

const progress = z.object({
  current: z.number().nonnegative(),
  goal: z.number().positive(),
  unit: z.string().min(1),
  updatedAt: date,
  source: z.string().min(3), // woher die Zahl kommt und wer sie pflegt
});

export const projectSchema = z
  .object({
    title: z.string().min(3),
    kind: z.enum(['app', 'spiel', 'challenge', 'marsch']),
    description: z.string().min(20),
    status: z.enum(['live', 'laufend', 'abgeschlossen']).default('laufend'),
    draft: z.boolean().default(false), // Entwurf: wird auf keiner Seite gezeigt (z. B. Spiel, noch nicht freigegeben)
    links: z.array(link).default([]),
    progress: progress.optional(),
  })
  .superRefine((p, ctx) => {
    if (p.progress && p.progress.current > p.progress.goal * 2) {
      ctx.addIssue({ code: 'custom', path: ['progress', 'current'], message: 'Stand weit über dem Ziel, bitte prüfen' });
    }
  });

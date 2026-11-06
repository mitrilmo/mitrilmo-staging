// Neuigkeit (kurzer Beitrag, Ersatz für den Blog-Slider der alten Seite). Dateiname = Slug, Muster JJJJ-MM-TT-titel.
// Spätere Beiträge kommen per ZIP-Export aus Momentwerk (siehe Vault: Feature-Briefing-Website-Export-ZIP).
import { z } from 'astro/zod';
import { date, httpsUrl } from './common.js';

// Link am Ende eines Beitrags: extern (https) oder intern relativ zum Site-Root (z. B. /pfadwerk.html).
const internalPath = z.string().regex(/^\/[a-z0-9][a-z0-9\-/.]*\.html$/, 'Interner Link wie /pfadwerk.html');
const link = z.object({ href: z.union([httpsUrl, internalPath]), text: z.string().min(3) });

export const newsSchema = ({ reference, image }) => {
  // Abschnitt eines längeren Beitrags (Momentwerk-Import): Überschrift, Text (Absätze durch Leerzeile), Fotos.
  // Die Einleitung steht im Fließtext der Datei, das Fazit ist ein normaler Abschnitt.
  const section = z.object({
    heading: z.string().min(2),
    text: z.string().default(''),
    photos: z.array(z.object({ image: image(), alt: z.string().min(3) })).default([]),
  });
  return z
    .object({
      title: z.string().min(3),
      date,
      description: z.string().min(20).max(300).optional(), // sonst die ersten Zeichen des Textes
      cover: image(),
      coverAlt: z.string().min(3),
      photos: z.array(z.object({ image: image(), alt: z.string().min(3) })).default([]),
      mood: z.string().min(2).optional(),
      weather: z.string().min(2).optional(),
      rating: z.number().int().min(1).max(5).optional(),
      tags: z.array(z.string().regex(/^[^\s#]+$/, 'Tag ohne Leerzeichen und ohne #')).default([]),
      link: link.optional(),
      tour: reference('tours').optional(),
      sections: z.array(section).default([]),
      momentwerkId: z.string().min(1).optional(), // erneuter Import überschreibt denselben Beitrag
      draft: z.boolean().default(false),
    });
};

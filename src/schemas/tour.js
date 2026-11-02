// Tour und Ziel (kind). Felder abgeleitet aus dem echten Tourenbestand (JS-Array `alle` der Live-Seite).
// Pflicht: title, place, description, duration, difficulty, image, imageAlt, publishedAt (bei kind=tour zusätzlich distanceKm).
// GPX, Koordinaten, Video, Region, Bewertung sind optional. Unbekanntes bleibt leer oder "unbekannt".
import { z } from 'astro/zod';
import { gpxPath, httpsUrl, season, triState, date } from './common.js';

const rating = z.object({
  hiking: z.number().int().min(1).max(5).optional(),
  scenery: z.number().int().min(1).max(5).optional(),
  refreshments: z.number().int().min(1).max(5).optional(),
  photo: z.number().int().min(1).max(5).optional(),
  highlight: z.string().optional(),
  note: z.string().optional(), // persönlicher Zusatz in Mos Worten, auch Kritisches
});

const parking = z.object({
  name: z.string().min(2),
  cost: z.string().optional(),
  note: z.string().optional(),
});

// helpers: { reference, image } aus astro:content (in den Tests Attrappen)
export const tourSchema = ({ reference, image }) =>
  z
    .object({
      title: z.string().min(3),
      kind: z.enum(['tour', 'ziel']).default('tour'),
      activity: z.enum(['wandern', 'radfahren', 'e-bike']).default('wandern'),
      routeType: z.enum(['rundweg', 'strecke', 'hin-und-zurueck', 'ohne-strecke']).optional(),
      place: z.string().min(2),
      region: z.string().optional(),
      startPoint: z.string().optional(),
      endPoint: z.string().optional(),
      description: z.string().min(20, 'Beschreibung zu kurz'),
      distanceKm: z.number().positive().optional(),
      duration: z.string().min(3), // Freitext wie "4–5 Std." (Bestand ist uneinheitlich)
      difficulty: z.enum(['sehr-leicht', 'leicht', 'mittel', 'schwer']),
      image: image(),
      imageAlt: z.string().min(3),
      gpx: gpxPath.optional(),
      coordinates: z.object({ lat: z.number().min(46).max(56), lng: z.number().min(5).max(16) }).optional(),
      video: reference('videos').optional(),
      stories: z.array(reference('stories')).default([]),
      komoot: httpsUrl.optional(),
      mapsUrl: httpsUrl.optional(), // Google-Maps-Suche zu Parkplatz, Start oder Anlegestelle (Link "Google Maps öffnen" der alten Seite)
      parking: parking.optional(),
      familyFriendly: triState,
      dogFriendly: triState,
      strollerOk: triState,
      openingHours: z.string().optional(),
      prices: z.string().optional(),
      refreshments: z.array(z.string()).default([]),
      equipment: z.array(z.string()).default([]),
      bestSeasons: z.array(season).default([]),
      tips: z.string().optional(),
      rating: rating.optional(),
      publishedAt: date,
      updatedAt: date.optional(),
    })
    .superRefine((t, ctx) => {
      if (t.kind === 'tour' && t.distanceKm === undefined) {
        ctx.addIssue({ code: 'custom', path: ['distanceKm'], message: 'Eine Tour braucht distanceKm' });
      }
      if (t.kind === 'ziel' && t.gpx) {
        ctx.addIssue({ code: 'custom', path: ['gpx'], message: 'Ein Ziel hat keine GPX-Strecke (kind: tour verwenden)' });
      }
      if (t.updatedAt && t.updatedAt < t.publishedAt) {
        ctx.addIssue({ code: 'custom', path: ['updatedAt'], message: 'updatedAt liegt vor publishedAt' });
      }
    });

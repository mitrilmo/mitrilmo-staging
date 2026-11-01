// Redaktionelle Seite mit eigener Adresse (pfadwerk.html, später ueber-mitrilmo.html). Der Text steht im Markdown-Teil.
import { z } from 'astro/zod';
import { date } from './common.js';

export const pageSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(20, 'Beschreibung für die Suchmaschine zu kurz').max(300),
  badge: z.string().optional(), // kleines Etikett im Kopfband, z. B. "📱 App-Projekt"
  subtitle: z.string().optional(),
  status: z.string().optional(), // z. B. "Stand: September 2026"
  updatedAt: date.optional(),
});

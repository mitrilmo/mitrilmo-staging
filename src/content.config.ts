import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { tourSchema } from './schemas/tour.js';
import { videoSchema } from './schemas/video.js';
import { storySchema } from './schemas/story.js';
import { eventSchema } from './schemas/event.js';
import { projectSchema } from './schemas/project.js';

// Eine Datei pro Inhalt, Dateiname = ID (Slug bzw. YouTube-ID). Fehlerhafte Einträge brechen den Build.
const tours = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tours' }),
  schema: tourSchema(reference),
});
const videos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/videos' }),
  schema: videoSchema,
});
const stories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stories' }),
  schema: storySchema(reference),
});
const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: eventSchema,
});
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});

export const collections = { tours, videos, stories, events, projects };

import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { tourSchema } from './schemas/tour.js';
import { videoSchema } from './schemas/video.js';
import { storySchema } from './schemas/story.js';
import { eventSchema } from './schemas/event.js';
import { projectSchema } from './schemas/project.js';
import { newsSchema } from './schemas/news.js';
import { pageSchema } from './schemas/page.js';

// Eine Datei pro Inhalt, Dateiname = ID (Slug bzw. YouTube-ID). Fehlerhafte Einträge brechen den Build.
// Bilder liegen als Originale unter src/assets/images/ und werden von Astro beim Bauen verkleinert (image()).
const tours = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tours' }),
  schema: ({ image }) => tourSchema({ reference, image }),
});
const videos = defineCollection({
  // ID = Dateiname mit Groß-/Kleinschreibung der YouTube-ID (der Standard würde sie klein schreiben und reference() fände sie nicht)
  loader: glob({ pattern: '**/*.md', base: './src/content/videos', generateId: ({ entry }) => entry.replace(/.md$/, '') }),
  schema: ({ image }) => videoSchema({ image }),
});
const stories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stories' }),
  schema: ({ image }) => storySchema({ reference, image }),
});
const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: eventSchema,
});
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: ({ image }) => newsSchema({ reference, image }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: pageSchema,
});

export const collections = { tours, videos, stories, events, projects, news, pages };

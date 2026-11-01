import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { rmSync } from 'node:fs';

// Staging (Standard): https://mitrilmo.github.io/mitrilmo-staging/
// Live: STAGING=false npm run build, Seite liegt dann unter https://www.mitrilmo.com/
const staging = process.env.STAGING !== 'false';

// Nur im Staging vorhandene Teile (Entscheidung Björn 01.11.2026: Mo's Hike Quest ist noch nicht live).
// Zum Freigeben fürs Live: Route immer einbinden und den Aufräum-Schritt unten entfernen.
const nurStaging = {
  name: 'nur-staging',
  hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      if (staging) injectRoute({ pattern: '/games/mos-hike-quest.html', entrypoint: './src/staging/mos-hike-quest.html.ts' });
    },
    'astro:build:done': ({ dir, logger }) => {
      if (!staging) {
        rmSync(new URL('images/game', dir), { recursive: true, force: true });
        logger.info('Live-Build: Spielbilder (images/game) entfernt, das Spiel ist noch nicht freigegeben');
      }
    },
  },
};

export default defineConfig({
  site: staging ? 'https://mitrilmo.github.io' : 'https://www.mitrilmo.com',
  base: staging ? '/mitrilmo-staging' : '/',
  build: { format: 'file' },
  integrations: [nurStaging],
  vite: { plugins: [tailwindcss()] },
});

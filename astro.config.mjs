import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { rmSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sitemapUrls, sitemapXml, robotsTxt } from './src/lib/sitemap.js';

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

// Nur Live: sitemap.xml und robots.txt (mit Sitemap-Zeile). Im Staging gibt es keine, dort schützt noindex.
const siteUrl = staging ? 'https://mitrilmo.github.io' : 'https://www.mitrilmo.com';
const suchmaschinen = {
  name: 'sitemap-und-robots',
  hooks: {
    'astro:build:done': ({ dir, logger }) => {
      if (staging) return;
      const root = fileURLToPath(dir);
      const html = readdirSync(root, { recursive: true }).filter((f) => String(f).endsWith('.html')).map(String);
      const urls = sitemapUrls(html, siteUrl);
      writeFileSync(join(root, 'sitemap.xml'), sitemapXml(urls));
      writeFileSync(join(root, 'robots.txt'), robotsTxt(siteUrl));
      logger.info(`Live-Build: sitemap.xml (${urls.length} Seiten) und robots.txt geschrieben`);
    },
  },
};

export default defineConfig({
  site: siteUrl,
  base: staging ? '/mitrilmo-staging' : '/',
  build: { format: 'file' },
  integrations: [nurStaging, suchmaschinen],
  vite: { plugins: [tailwindcss()] },
});

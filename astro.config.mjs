import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Staging (Standard): https://mitrilmo.github.io/mitrilmo-staging/
// Live: STAGING=false npm run build, Seite liegt dann unter https://www.mitrilmo.com/
const staging = process.env.STAGING !== 'false';

export default defineConfig({
  site: staging ? 'https://mitrilmo.github.io' : 'https://www.mitrilmo.com',
  base: staging ? '/mitrilmo-staging' : '/',
  build: { format: 'file' },
  vite: { plugins: [tailwindcss()] },
});

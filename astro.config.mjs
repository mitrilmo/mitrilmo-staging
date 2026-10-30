import { defineConfig } from 'astro/config';

// Spike AP0.7: Test-URL ist https://mitrilmo.github.io/mitrilmo-staging/
// Beim Cutover entfaellt base, die Seite liegt dann unter www.mitrilmo.com/
const staging = process.env.STAGING !== 'false';

export default defineConfig({
  site: staging ? 'https://mitrilmo.github.io' : 'https://www.mitrilmo.com',
  base: staging ? '/mitrilmo-staging' : '/',
  build: { format: 'file' },
});

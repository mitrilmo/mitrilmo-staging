// Baut die Seite plattformunabhängig (Windows, macOS, Linux).
//   node scripts/build.mjs          Staging (Test-URL, noindex)
//   node scripts/build.mjs live     Live (www.mitrilmo.com, Basispfad /)
// Der Live-Modus setzt STAGING=false nur für diesen Build.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const live = process.argv.includes('live');
const astro = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url));
const env = { ...process.env, ...(live ? { STAGING: 'false' } : {}) };
const r = spawnSync(process.execPath, [astro, 'build'], { cwd: root, env, stdio: 'inherit' });
process.exit(r.status ?? 1);

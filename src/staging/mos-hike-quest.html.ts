// Mo's Hike Quest: eigenständiges Spiel, NUR im Staging (astro.config.mjs bindet die Route nur dort ein; Freigabe fürs Live durch Björn offen) (Quelle: src/game/mos-hike-quest.html, Bilder unter public/images/game/).
// Der Endpunkt ergänzt zur Bauzeit, was jede Seite braucht: Beschreibung, Canonical, noindex im Staging und die Rechtlich-Links.
import source from '../game/mos-hike-quest.html?raw';
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const staging = base !== '';
  const canonical = new URL(`${base}/games/mos-hike-quest.html`, site).href;
  let html = source;
  const desc = 'Mo&#39;s Hike Quest: ein kleines Laufspiel durch 6 Etappen Bergisches Land. Lauf, spring und duck dich zur nächsten Schutzhütte, deine Zeit ist dein Highscore.';
  const head = [
    `<meta name="description" content="${desc}">`,
    `<link rel="canonical" href="${canonical}">`,
    '<meta property="og:site_name" content="mitrilmo">',
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="Mo&#39;s Hike Quest">',
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${new URL(`${base}/images/channel-logo.jpg`, site).href}">`,
    staging ? '<meta name="robots" content="noindex, nofollow">' : '',
  ].filter(Boolean).join('\n');
  const footer = `<p style="margin:24px 0 0;font-size:12px;color:var(--stone-400)"><a href="${base}/#impressum" style="color:inherit">Impressum</a> · <a href="${base}/#datenschutz" style="color:inherit">Datenschutz</a></p>`;
  // Inhalt in <main> fassen (Landmarke für Screenreader), Rechtlich-Links stehen mit darin
  html = html.replace('</head>', `${head}\n</head>`).replace('<body>', '<body>\n<main>').replace('</body>', `${footer}\n</main>\n</body>`);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
};

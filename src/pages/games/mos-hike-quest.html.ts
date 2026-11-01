// Mo's Hike Quest: eigenständiges Spiel (Quelle: src/game/mos-hike-quest.html, Bilder unter public/images/game/).
// Der Endpunkt ergänzt zur Bauzeit, was jede Seite braucht: Beschreibung, Canonical, noindex im Staging und die Rechtlich-Links.
import source from '../../game/mos-hike-quest.html?raw';
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const staging = base !== '';
  const canonical = new URL(`${base}/games/mos-hike-quest.html`, site).href;
  let html = source;
  const head = [
    '<meta name="description" content="Mo&#39;s Hike Quest: ein kleines Laufspiel durch 6 Etappen Bergisches Land. Lauf, spring und duck dich zur nächsten Schutzhütte, deine Zeit ist dein Highscore.">',
    `<link rel="canonical" href="${canonical}">`,
    staging ? '<meta name="robots" content="noindex, nofollow">' : '',
  ].filter(Boolean).join('\n');
  const footer = `<p style="margin:24px 0 0;font-size:12px;color:var(--stone-400)"><a href="${base}/#impressum" style="color:inherit">Impressum</a> · <a href="${base}/#datenschutz" style="color:inherit">Datenschutz</a></p>`;
  html = html.replace('</head>', `${head}\n</head>`).replace('</body>', `${footer}\n</body>`);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
};

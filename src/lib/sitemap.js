// Sitemap und robots.txt für den Live-Build (Staging bekommt keine, dort schützt nur noindex).

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Seiten, die nie in die Sitemap gehören
const EXCLUDED = [/^404\.html$/, /(^|\/)dev-[^/]*\.html$/, /^stories\/test\.html$/];

// htmlFiles: Pfade relativ zu dist/ (z. B. 'index.html', 'touren/xyz.html'), site: 'https://www.mitrilmo.com'
export function sitemapUrls(htmlFiles, site) {
  const origin = site.replace(/\/$/, '');
  return htmlFiles
    .map((f) => f.replace(/\\/g, '/'))
    .filter((f) => f.endsWith('.html') && !EXCLUDED.some((re) => re.test(f)))
    .map((f) => `${origin}/${f}`) // wie der Canonical: auch die Startseite als /index.html
    .sort();
}

export function sitemapXml(urls) {
  const items = urls.map((u) => `  <url><loc>${escapeXml(u)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

export function robotsTxt(site) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${site.replace(/\/$/, '')}/sitemap.xml\n`;
}

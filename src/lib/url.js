// Interne Adressen aus Inhalten (z. B. projects/*.md: links[].href = "/pfadwerk.html") gelten relativ zum Site-Root
// und müssen beim Ausgeben den Basispfad bekommen (Staging /mitrilmo-staging, live leer).
// Nutzung in Seiten: withBase(import.meta.env.BASE_URL, link.href). Externe https-Adressen bleiben unverändert.
export function withBase(base, href) {
  if (/^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return href;
  const b = (base || '').replace(/\/$/, '');
  return b + (href.startsWith('/') ? href : '/' + href);
}

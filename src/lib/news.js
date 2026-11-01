// Hilfen für die Neuigkeiten-Seiten (getestet in tests/news.test.mjs).
// Kurztext für Übersicht und Meta Description: description, sonst der erste Absatz, gekürzt an einer Wortgrenze.
export function teaser(entry, max = 160) {
  const text = entry.data.description ?? (entry.body ?? '').split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ') > 40 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:.\s]+$/, '') + '…';
}

// Neueste zuerst, Entwürfe raus.
export const published = (entries) => entries.filter((e) => !e.data.draft).sort((a, b) => b.data.date - a.data.date);

// Externe Links (https) öffnen in neuem Tab, interne nicht.
export const isExternal = (href) => /^https:\/\//.test(href);

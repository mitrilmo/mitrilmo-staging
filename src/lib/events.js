// Termine: abgelaufene Einträge ausblenden (endDate ist der letzte Tag, er zählt noch mit) und nach Beginn sortieren.
// Gerechnet wird in UTC auf Tagesbasis, damit die Zeitzone des Rechners keine Rolle spielt.
export const dayKey = (d) => d.toISOString().slice(0, 10);

export function upcoming(events, today = new Date()) {
  const t = dayKey(today);
  return events
    .filter((e) => dayKey(e.data.endDate) >= t)
    .sort((a, b) => dayKey(a.data.startDate ?? a.data.endDate).localeCompare(dayKey(b.data.startDate ?? b.data.endDate)) || a.data.title.localeCompare(b.data.title, 'de'));
}

// "10. bis 12. Oktober 2026", "3. Oktober 2026", Termine über Monatsgrenzen mit beiden Monaten.
export function rangeDe(start, end) {
  const f = (d, opts) => new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', ...opts }).format(d);
  const full = (d) => f(d, { day: 'numeric', month: 'long', year: 'numeric' });
  if (!start || dayKey(start) === dayKey(end)) return full(end);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  if (sameMonth) return `${f(start, { day: 'numeric' })}. bis ${full(end)}`;
  return `${sameYear ? f(start, { day: 'numeric', month: 'long' }) : full(start)} bis ${full(end)}`;
}

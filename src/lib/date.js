// Datum auf Deutsch ("31. Oktober 2026"), UTC, damit der Tag nicht von der Zeitzone des Rechners abhängt.
export const dateDe = (d) => new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);

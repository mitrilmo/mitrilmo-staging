// Hauptnavigation (Slug-Tabelle, freigegeben 30.10.2026).
// live: false = Seite existiert noch nicht, wird nicht angezeigt. Beim Bau der Seite auf true setzen.
// tab: true = Platz in der festen Leiste unten am Handy (Reihenfolge wie hier, zuletzt "Mehr" mit dem Rest).
//   Festgelegt am 02.11.2026: Touren, Geschichten, Termine, Neuigkeiten, Mehr.
// header: false = nur im "Mehr"-Fenster und auf der Seite Entdecken, nicht in der Kopfzeile am Rechner.
export const nav = [
  { label: 'Entdecken', href: 'entdecken.html', live: true },
  { label: 'Touren', href: 'touren.html', live: true, tab: true },
  { label: 'Videos', href: 'videos.html', live: true },
  { label: 'Geschichten', href: 'geschichten.html', live: true, tab: true },
  { label: 'Termine', href: 'termine.html', live: true, tab: true, header: false },
  { label: 'Neuigkeiten', href: 'neuigkeiten.html', live: true, tab: true, header: false },
  { label: 'Weltreise', href: 'weltreise.html', live: true, header: false },
  { label: 'Projekte', href: 'projekte.html', live: true },
  { label: 'Pfadwerk', href: 'pfadwerk.html', live: true, header: false },
  { label: 'Über mitrilmo', href: 'ueber-mitrilmo.html', live: true },
];

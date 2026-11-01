// Spruch des Tages der Startseite (Phase 3). Der Spruch wechselt je Kalendertag: Index = Tag des Jahres modulo Anzahl.
export const SPRUECHE = [
  "Der schönste Trail ist der, den man nicht googeln musste.",
  "Frische Luft ist kostenlos – schlechte Laune bleibt trotzdem manchmal im Auto.",
  "Ein Regenschauer macht aus jedem Spaziergang ein Abenteuer.",
  "Blasen am Fuß sind kein Beweis für Härte, nur für falsche Socken.",
  "Bergisches Land: Hügel, wo man sie nicht erwartet.",
  "Die beste Ausrüstung ist die, die du tatsächlich mitnimmst.",
  "Manchmal ist die Brotzeit der eigentliche Tourhöhepunkt.",
  "Kein Netz, kein Problem – nur Wald.",
  "Auch ein 5-km-Spaziergang zählt als Abenteuer, wenn das Wetter mitspielt.",
  "Wer zu schnell geht, verpasst die guten Aussichtspunkte.",
  "Der Wanderweg endet nie da, wo die Karte es sagt.",
  "Gummistiefel schlagen Wanderschuhe, wenn man Kinder mitnimmt.",
  "Jeder Hügel hier denkt, er wäre ein Berg.",
  "Die Pause ist Pflichtprogramm, nicht Kür.",
  "Manchmal ist der Parkplatz das größte Abenteuer der Tour.",
  "Ein Picknick im Grünen schlägt jedes Restaurant.",
  "Schlechtes Wetter gibt's nicht, nur schlechte Klamotten.",
  "Kinder messen Touren in Pausen, nicht in Kilometern.",
  "Der Wald wartet geduldig, auch wenn man spät dran ist.",
  "Manchmal reicht schon der Weg um den Block für gute Laune.",
  "Wer die Karte studiert, verläuft sich trotzdem.",
  "Outdoor-Gadgets testen sich am besten im strömenden Regen.",
  "Auch der zehnte Stausee sieht jedes Mal anders aus.",
  "Eine gute Tour braucht keine Filter – nur Tageslicht.",
  "Der Rückweg fühlt sich immer länger an als der Hinweg.",
  "Manchmal ist der Umweg die eigentliche Route.",
  "Wandern ist die einzige Sportart, bei der Stehenbleiben für Fotos zählt.",
  "Drei Kilometer mit Kind sind wie zehn Kilometer ohne.",
  "Auch im Regen gilt: lieber draußen nass als drinnen trocken gelangweilt.",
  "Der Talsperren-Blick entschädigt für jeden Anstieg davor.",
];

// Gleiche Rechnung wie auf der alten Seite (Tag des Jahres, 1. Januar = 1)
export function spruchFuer(datum = new Date()) {
  const tagDesJahres = Math.floor((datum - new Date(datum.getFullYear(), 0, 0)) / 86400000);
  return SPRUECHE[tagDesJahres % SPRUECHE.length];
}

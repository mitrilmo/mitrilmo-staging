// Alte Anker der Startseite (URL-Inventar, Abschnitt 3).
// - #impressum und #datenschutz öffnen das Modal auf der Startseite (wie heute, kein Redirect).
// - Alle anderen alten Anker leiten auf die neue Seite weiter, aber nur, wenn diese Seite schon existiert (livePages).
// Diese Datei wird als Text in den <head> der Startseite eingebettet und in tests/anchors.test.mjs geprüft.
var ANCHOR_MODALS = { '#impressum': 'impressum', '#datenschutz': 'datenschutz' };
var ANCHOR_PAGES = {
  '#touren': 'touren.html',
  '#videos': 'videos.html',
  '#shortsSection': 'videos.html#shorts',
  '#wanderberichte': 'geschichten.html',
  '#weltreiseSection': 'weltreise.html',
  '#randnotizenSection': 'geschichten.html#randnotizen',
  '#archiveSection': 'geschichten.html#archiv',
  '#eventsSection': 'termine.html',
  '#upcomingSection': 'termine.html',
  '#blogSlider': 'neuigkeiten.html',
  '#ueber': 'ueber-mitrilmo.html'
};
function resolveHash(hash, livePages) {
  if (ANCHOR_MODALS[hash]) return { type: 'modal', id: ANCHOR_MODALS[hash] };
  var to = ANCHOR_PAGES[hash];
  if (to && livePages.indexOf(to.split('#')[0]) >= 0) return { type: 'redirect', to: to };
  return null;
}

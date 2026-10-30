// Meteorologische Jahreszeit nach Monat (Browserzeit des Besuchers).
// Diese Datei wird als Text in den <head> eingebettet (Layout) und in tests/season.test.mjs geprueft.
function seasonFor(date) {
  var m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'fruehling';
  if (m >= 6 && m <= 8) return 'sommer';
  if (m >= 9 && m <= 11) return 'herbst';
  return 'winter';
}

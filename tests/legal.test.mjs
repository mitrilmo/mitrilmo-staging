import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Der Wortlaut von Impressum und Datenschutz soll 1:1 dem der alten Live-Seite entsprechen (Entscheidung Björn, 30.10.2026).
// Die Prüfsummen wurden am 30.10.2026 gegen die Modals der Live-Seite (index.html auf main) verglichen und waren identisch.
// Normalisiert wird: HTML-Kommentare entfernen, Leerraum zusammenfassen.
//
// ÄNDERT SICH DER TEXT ABSICHTLICH (z. B. Impressum wegen der Pfadwerk-Monetarisierung, neue Datenschutz-Angaben),
// dann nur nach Rücksprache mit Björn: Text in src/legal/ ändern, Test laufen lassen, die neue Prüfsumme hier eintragen
// und im CHANGELOG vermerken.
const PINNED = {
  impressum: 'bcec1433bb0375f9d2ad56c48e7742fff61de7d38c6bbe64fe91176d744e8db2',
  datenschutz: '011b8c0a1ccf16b06a6332d9054a8ce5ab4449b1dc98a8dacc0afe150e2b07b8',
};
const norm = (h) => h.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
const sha = (s) => createHash('sha256').update(s).digest('hex');

for (const [name, expected] of Object.entries(PINNED)) {
  test(`Rechtstext ${name}: unverändert gegenüber der Live-Fassung`, () => {
    const text = norm(readFileSync(new URL(`../src/legal/${name}.html`, import.meta.url), 'utf8'));
    assert.equal(
      sha(text),
      expected,
      `Der Text von ${name} weicht von der Fassung ab, die mit der Live-Seite verglichen wurde. Nur nach Rücksprache mit Björn ändern, danach die Prüfsumme in tests/legal.test.mjs aktualisieren.`,
    );
  });
}

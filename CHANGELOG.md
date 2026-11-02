# Changelog – mitrilmo-Website 2.0 (Neubau, Staging)

## 2026-11-02 (Phase 3, AP3.4 und AP3.5 Startseite, erste Fassung)

### Neu
- **Startseite** ersetzt den Platzhalter: Hero mit dem Claim „Raus. Entdecken. Teilen.“, Unterzeile und drei Wegweiser-Schildern als Links (Raus ins Grüne, Auf der Couch mitkommen, Zum Nachlesen), darunter Neu bei mitrilmo (vier jüngste Inhalte mit Datum, Weltreise 2017 zählt nicht, Hinweis auf den nächsten Termin der Region), Für das Wochenende (drei jüngste Touren mit Video), Wer ist Mo (Text aus Über mitrilmo gekürzt) und Dranbleiben (YouTube, Komoot, Instagram, dazu eine ruhige Zeile zu Einfach mal KI).
- **Jahreszeiten-Szene** im Hero (`HeroScene.astro`): Berge, Tannen, Sonne oder Mond, Schneekappen nur im Winter. Farben über `html[data-season]`, keine Bilddatei. Schilder mit Hover und sichtbarem Fokus.

### Geändert
- Die Testlinks der Platzhalter-Startseite (Jahreszeit, Teststory) sind entfernt, `?season=` funktioniert weiter. `#impressum` und `#datenschutz` öffnen weiter die Modals.
- Trassentrecking im Pott: Landschaft 4 und Highlight.

### Offen
- Unterseiten-Landschaftsstreifen, Safari- und iPhone-Test, Review-Subagent. Tiere, Partikel und Parallax bleiben in der zweiten Welle.

## 2026-11-02 (Einschätzungen zu den Touren)

### Neu
- **Einschätzung bei 9 Touren** (Noten und Texte von Björn aus dem Google Doc): Landschaft und Einkehr als Sterne (1 bis 5, Zusatz „von 5“ für Screenreader), dazu Highlight und „Auch ehrlich“. Neues Feld `rating.note`. Der Block erscheint auch mit nur einem Text ohne Note. Noch ohne Einschätzung: Trassentrecking im Pott, Nachtmammutmarsch, 6-Schleusen-Fahrt, Landesgartenschau Neuss.

### Geändert
- Einkehr-Angaben bei 7 Touren mit Björns Ortsangaben ersetzt (zum Beispiel Yuva-Restaurant am Hülsenbecker Tal, Gasthaus Plessen geschlossen). `updatedAt` bei den 9 Touren auf 02.11.2026.

## 2026-11-02 (Phase 3, AP3.3 Mediathek, Geschichten, Termine, Projekte, Entdecken)

### Neu
- **Videos** `/videos.html`: 18 Videos mit lokalem Vorschaubild als Link zu YouTube, 14 Shorts als Textkarten. Beim Laden der Seite gibt es keine Anfrage an YouTube.
- **Geschichten** `/geschichten.html`: Berichte nach Unterwegs, Randnotizen und Archiv, dazu ein Block zur Weltumrundung 2017 mit Link auf `/weltreise.html`.
- **Termine** `/termine.html`: Region und Kanal getrennt, abgelaufene Einträge werden beim Bauen und zusätzlich im Browser ausgeblendet (`endDate` zählt als letzter Tag). `src/lib/events.js` mit 3 Tests.
- **Projekte** `/projekte.html`: Entwürfe (`draft`) bleiben unsichtbar, Fortschritt nur mit Stand und Quelle.
- **Entdecken** `/entdecken.html`: Übersicht mit Kacheln und Anzahlen zu allen Bereichen.

### Geändert
- `nav.js`: Entdecken, Videos, Geschichten, Termine, Projekte live. Kopfzeile am Rechner: Entdecken, Touren, Videos, Geschichten, Projekte, Neuigkeiten, Über mitrilmo; Termine, Weltreise und Pfadwerk nur in „Mehr“ und auf Entdecken (sonst zu eng bei Tablet-Breite).

## 2026-11-02 (Phase 3, AP3.1 und AP3.2 Touren)

### Neu
- **Touren-Übersicht** `/touren.html`: 13 Einträge als Karten, Filter nach Art, Schwierigkeit und Länge (am Handy eingeklappt, Dauer und Region folgen nicht, weil die Angaben uneinheitlich bzw. fast leer sind). Karte der Region als SVG (Umrisse aus der alten Seite, `src/data/region-map.js`), Pins aus den Koordinaten, 10 von 13 Einträgen haben einen Pin, Pins und Karten filtern gemeinsam.
- **Tourseiten** `/touren/<slug>.html`: Kennzahlen (Länge, Dauer, Schwierigkeit, Auf- und Abstieg aus der GPX), GPX-Download, Links zu Komoot und Google Maps, Streckenverlauf und Höhenprofil als SVG (beim Bauen aus der GPX berechnet), Video als Link mit lokalem Vorschaubild, Einschätzung, Praktisches, Tipp, Verweis auf Berichte, „zuletzt aktualisiert“. Blöcke ohne Daten entfallen.
- `src/lib/tours.js` mit GPX-Auswertung und 6 neuen Tests.

### Geändert
- Touren in der Navigation und in der Leiste am Handy sichtbar (`live: true`). Die Projektseite Mammut- und Megamärsche verlinkt damit auf eine gültige Seite.
- Offen: Die Pin-Positionen kommen jetzt aus den echten Koordinaten. Die alten Pins waren von Hand gesetzt und lagen teils in einer Spalte, die Lage einzelner Pins weicht deshalb ab.

## 2026-11-02 (Phase 3, AP3.6 mobile Navigation)

### Neu
- **Feste Leiste unten am Handy** (`MobileBar.astro`, unter `md` sichtbar): Touren, Geschichten, Termine, Neuigkeiten, Mehr (Entscheidung Björn). „Mehr" öffnet ein Fenster mit den übrigen Seiten und Impressum und Datenschutz als eigene Kacheln (Videos, Entdecken, Weltreise, Projekte, Pfadwerk, Über mitrilmo). Bereiche erscheinen erst, wenn ihre Seite in `nav.js` auf `live: true` steht.
- Nach-oben-Knopf (ab 600 px Scrolltiefe) und dünne Fortschrittslinie beim Lesen, beides ohne externe Abhängigkeit, Scrollen ohne Animation bei `prefers-reduced-motion`.
- Aufklappbares Inhaltsverzeichnis in `Prose` ab drei Zwischenüberschriften.

### Geändert
- `nav.js`: Felder `tab` und `header`, neue Einträge Termine (noch nicht live) und Pfadwerk (nur in „Mehr").
- Kopfzeilen-Navigation nur noch ab `md`, am Handy übernimmt die Leiste. Footer mit Abstand nach unten für die Leiste.

## 2026-11-01 (Entscheidungen nach M2-Review)

### Geändert
- **Mo's Hike Quest ist nur im Staging** (Entscheidung Björn): Die Route wird in `astro.config.mjs` nur bei Staging eingebunden (`src/staging/`), der Live-Build entfernt `images/game`, der Projekt-Eintrag ist `draft: true` (neues Feld `draft` im Projektschema). Zum Freigeben die Route immer einbinden, den Aufräum-Schritt entfernen und `draft` löschen.
- **Das Spiel speichert nichts mehr** im Browser (kein `localStorage`): Ton und Bestzeit gelten nur, solange die Seite offen ist. Der Datenschutztext bleibt dadurch unverändert.
- `channel-logo.jpg` liegt unverändert unter `/images/` (ohne Metadaten neu kodiert, 1024 px), für Altverweise und später `og:image`.

## 2026-11-01 (M2 Review)

### Geändert (nach Review-Subagent)
- `parity.mjs`: Eine Prüfung ohne Treffer in der alten Seite meldet jetzt einen Fehler (vorher "0 von 0 = vollständig"). Der Event-Abschnitt wird über Marker statt über feste Zeilen gefunden, es müssen genau 13 Region-Events gefunden werden.
- Alle `migrate-*.mjs` starten nur noch mit `--force` (sie überschreiben Inhalte und löschen teils Ordner). `migrate-events.mjs` findet den Abschnitt ebenfalls über Marker.
- `check-dist` sperrt `stories/test.html` fürs Live-Bauen, wie `dev-bilder.html`.

## 2026-11-01 (Phase 2, AP2.7 Paritätsliste)

### Neu
- **Paritätsprüfung** `scripts/parity.mjs`: vergleicht die alte Seite (Branch main) mit dem Neubau, Touren und ihre Felder, 29 YouTube-IDs, 33 Stories, 16 Events, 6 Neuigkeiten, Monatscodes, 35 externe Links, 30 Sprüche. Endet mit Fehlercode 1, wenn etwas fehlt. Eine bewusste Abweichung (Altenberger Dom 16,4 km) ist im Skript begründet.
- **Sprüche des Tages** (30) als `src/data/sprueche.js` mit `spruchFuer()` (gleiche Rechnung wie die alte Seite), Test dazu.
- Tour-Feld `mapsUrl` (Link "Google Maps öffnen" zu Parkplatz, Start oder Anlegestelle) für 8 Touren und Ziele. Das fiel bei der Prüfung als Lücke auf.
- Vault: `mitrilmo-Website 2.0 - Paritätsliste.md` (Inhalte, Abschnitte, Funktionen, bewusste Änderungen, offene Punkte für Phase 3).

## 2026-11-01 (Phase 2, AP2.6 Über mitrilmo)

### Neu
- Seite `/ueber-mitrilmo.html` (`scripts/migrate-ueber.mjs`): "Über den Kanal" mit den vier Kacheln, Abo-Link und Kennzahlen als Text, dazu die drei Geschichten "Wer ist Björn?", "Woher kommt mitrilmo?" und "Wie alles begann". Die Tabs der alten Seite sind drei Abschnitte untereinander und ohne JavaScript lesbar, oben steht ein Inhaltsverzeichnis. Alle Texte der alten Seite sind vorhanden.
- Komponente `Prose` für Markdown-Seiten (aus der Pfadwerk-Seite herausgelöst), Links zu Google Play und zum YouTube-Kanal erscheinen als Knopf.

### Geändert
- Navigation: "Über mitrilmo" ist jetzt sichtbar. Der alte Anker `#ueber` leitet damit auf die neue Seite weiter.
- Der zweite Knopf "YouTube-Kanal öffnen" (Karte rechts) entfällt, es bleibt "Jetzt abonnieren". Das Logo der Karte kommt mit der Startseite in Phase 3.

## 2026-11-01 (Phase 2, AP2.5 Events, Projekte, Pfadwerk)

### Neu
- **16 Events** migriert (`scripts/migrate-events.mjs`): 13 aus "Demnächst in der Region" und 3 Vorhaben aus "Demnächst auf dem Kanal" (`scope: kanal`, ohne Veranstalter-Link). Neue Felder `scope`, `time`, `price`; `url` ist nur bei Events der Region Pflicht. Preis "unbekannt" bleibt leer.
- **Pfadwerk-Seite** `/pfadwerk.html` (aus `pfadwerk.html` des Branches main, mit den Monatscodes 2027): Text als Markdown in der neuen Sammlung `pages`, 16 Screenshots neu kodiert, Inhaltsverzeichnis automatisch aus den Überschriften. Monatscodes liegen in `src/data/premium-codes.js` (Seite wählt den Code nach dem Datum des Besuchers). `check:content` meldet, wenn der Code des laufenden Monats fehlt oder ab dem 20. der des Folgemonats.
- **Mo's Hike Quest** unter `/games/mos-hike-quest.html` (Quelle `src/game/`, Endpunkt ergänzt Beschreibung, Canonical, noindex im Staging, Umami und Rechtlich-Links zur Bauzeit). Spielbilder von 10,7 MB auf 1,4 MB verkleinert.
- Projekte: Mo's Hike Quest und "Mammut- und Megamärsche" angelegt (Letzteres nur der Eintrag, die Projektseite folgt in Phase 3); Wander-Challenge mit Link zur Veranstaltung.

### Geändert
- `pfadwerk.html` steht nicht mehr in `PENDING` (check-dist).

### Offen
- Projektseite Mammut- und Megamärsche und die Anzeige der Events/Projekte auf der Startseite (Phase 3).
- Review-Subagent zum Meilenstein M2 (Struktur: neue Sammlung `pages`, Endpunkt für das Spiel).

## 2026-11-01 (Phase 2, Unterseiten im Jahreszeiten-Look)

### Geändert
- Weltreise, Neuigkeiten, Einzelbeiträge und Stories bekommen ein Kopfband mit dem Himmelsverlauf der Startseite (neue Komponente `PageHero`) und nutzen die Jahreszeit-Akzentfarbe (`accent`) statt festem Grün für Badges, Links und Hover. Das Logo "mitril" bleibt grün wie live.

## 2026-11-01 (Phase 2, AP2.4 Stories)

### Neu
- 9 weitere Stories migriert (Einmal-Skript `scripts/migrate-stories.mjs`): 5 Wanderberichte mit Fotos (3-Türme-Weg, Heilenbecke, Elbschetal, Klutert/Rüggeberg-Filde, Glörtalsperre), Mammutmarsch-Überlebenstipps und KI-Lernkurve Teil 1 bis 3. Damit sind alle 33 Stories da.
- 67 Fotos aus dem Base64 im alten HTML herausgelöst, ohne Metadaten und GPS neu kodiert (`src/assets/images/stories/<Story>/NN.jpg`), mit Bildunterschrift als Alt-Text und sichtbarer Unterschrift.
- Touren Heilenbecke, Elbschetal und Mammutmarsch verweisen auf ihre Story (`stories`).
- `check-content` zählt Bilder im Fließtext als verwendet und prüft sie auf GPS und Existenz.
- Story-Seite: Zwischenüberschriften und Bilder im Text gestaltet.

### Geändert
- Der Statistik-Kasten am Ende der Berichte (Rohtext mit `---` und Sternchen) ist jetzt echtes Markdown: Trennlinie, fette Überschrift, Aufzählung. Auch die Markdown-Reste `###` und `**` in Elbschetal und Glör sind jetzt Überschrift und Fettdruck. Die Wörter sind unverändert.
- Texte gegen die alte Seite geprüft (Buchstaben und Ziffern identisch bei allen 9).
- Beschreibung der Wanderberichte = Textanfang (alte Seite hatte keine).

## 2026-11-01 (Phase 2, AP2.3 Ziele)

### Neu
- Ziel **6-Schleusen-Fahrt** (`kind: ziel`, Essen bis Gelsenkirchen, mit dem Schiff). Koordinaten fehlen bewusst, die alte Seite nennt nur einen Maps-Suchlink.

### Geändert
- Landesgartenschau Neuss: `publishedAt` von Platzhalter auf 2026-08-05 (erstes Erscheinen auf der alten Seite), Beispiel-Kommentar entfernt. Der Hinweis, dass die LAGA am 11.10.2026 endete, steht in der Beschreibung.

## 2026-11-01 (Phase 2, AP2.2 Mediathek)

### Neu
- Restliche Mediathek migriert: 3 weitere Videos (6 Schleusen, Outdoor-Navi-Härtetest, Megamarsch Düsseldorf) mit lokalem Vorschaubild und **14 Shorts** (Textkarten mit Datum, ohne Vorschaubild). Einmal-Skript `scripts/migrate-videos.mjs`.
- Videoschema: Feld `format` (`video` oder `short`), `thumbnail` nur bei Videos Pflicht, Shorts brauchen ein Datum (Prüfung in `checks.mjs`).

### Geändert
- Video-IDs behalten ihre Groß-/Kleinschreibung (`generateId` im Loader). Vorher schrieb Astro sie klein, und `reference()` meldete beim Build "Invalid content reference" für alle Tour-Videos.

### Geändert (Nachtrag)
- Neue Thumbnails (Textfassung mit Schlagzeile) für 10 Videos eingesetzt (zuletzt 6 Schleusen und Megamarsch Düsseldorf), Video "Rucksackhaken" angelegt.
- Drei weitere Videos angelegt: Drachen-Power (Drachenfels), Talsperren-Therapie (Lister), Verschwundene Grenzen (Bergische Landwehr). Titel von YouTube übernommen.

Protokoll der Änderungen am Neubau. Die alte Live-Seite hat ihr eigenes Changelog (nicht in diesem Repo).
Format pro Eintrag: Datum, dann nur zutreffende Kategorien **Neu**, **Geändert**, **Entfernt**.

## 2026-11-01 (Phase 2, AP2.1 Touren)

### Neu
- Alle **11 Touren** migriert (`src/content/tours/`, Einmal-Skript `scripts/migrate-tours.mjs`): 8 aus dem Bestand (JS-Array `alle`) und die 3 neuen (Pilger-Alarm Breckerfeld, Schneckenlauf Ennepetal, Nachtmammutmarsch Ruhrgebiet). Neue Slugs laut Slug-Tabelle (`3-tuerme-weg-hagen`, `huelsenbecker-tal`, `altenberger-dom`). 9 neue Titelbilder und 11 GPX übernommen, Bilder über `import-image.mjs`.
- 9 **Videos**, auf die Touren verweisen (Hasper Talsperre, Neye, Pilger-Alarm, Schneckenlauf, Mammutmarsch, Altenberger Dom, Elbschetal, Trassentrekking, Hülsenbecker Tal), mit lokalem Vorschaubild.
- Koordinaten für Heilenbecke, Neye und die drei neuen Touren aus dem GPX-Start.

### Geändert
- Beispiele 3-Türme-Weg und Heilenbecke vollständig (Komoot-Link, Koordinaten).
- Beschreibungen ohne die doppelte Tipp-Zeile (💡) und ohne Schluss-Emojis, Tippfehler "mittele" korrigiert. Länge der neuen Touren laut GPX (6,7 / 10,6 / 30,3 km).

### Offen aus AP2.1
- Alt-Texte der Titelbilder sind Platzhalter ("Titelbild zur Tour …"), `place` ist bei den Bestandstouren die alte `region`, `publishedAt` ist das Datum der ersten Veröffentlichung auf der alten Seite (aus Git).

## 2026-11-01 (Phase 2, Neuigkeiten)

### Neu
- Seite **Weltreise** (`/weltreise.html`) als Ersatz für das Weltumrundungs-Karussell: alle 24 Tage (Tag 0 bis 23) als Karten mit Datum, Titel und Vorschautext. Die 24 Tagesberichte sind als Stories migriert (`/stories/weltumrundung-tag-…html`, Texte unverändert, Einmal-Skript `scripts/migrate-weltreise.mjs`) und haben eine eigene Seitenvorlage `src/pages/stories/[slug].astro`. Story-Schema neu: `series`, `day`, `video` (YouTube-ID eines nicht gelisteten Kurzvideos, nur als Link, nie in der Mediathek). Anker `#weltreiseSection` leitet auf `weltreise.html`.
- Seite **Neuigkeiten** (`/neuigkeiten.html`, Beiträge unter `/neuigkeiten/<slug>.html`) als Ersatz für den Blog-Slider der alten Seite. Neue Collection `news` (Schema `src/schemas/news.js`): Titelbild mit Alt-Text, optional Fotos, Stimmung, Wetter, Bewertung, Tags, Link (extern https oder intern), Tour-Verweis, `momentwerkId`, `draft`.
- Die sechs Beiträge des alten Sliders übernommen (Texte unverändert, Bilder über `import-image.mjs`).
- Alter Anker `#blogSlider` leitet auf `neuigkeiten.html` weiter, Menüpunkt "Neuigkeiten" (live).
- Prüfungen: `check:content` kennt `news` (Titelbild, Fotos, kein GPS, Tour-Verweis), `import-image.mjs` akzeptiert das Ziel `news/`. 18 neue Tests.

## 2026-10-30 (Phase 1, Meilenstein M1)

### Neu
- Staging-Repo `mitrilmo-staging` mit Astro 7, Deployment per GitHub Actions auf GitHub Pages (Test-URL `https://mitrilmo.github.io/mitrilmo-staging/`), `noindex` im Staging.
- Tailwind lokal gebaut (kein CDN), Farben als Tokens wie auf der Live-Seite. Schrift Inter lokal mit SIL-OFL-Lizenztext (`public/fonts/OFL-Inter.txt`), keine externen Schriftdienste.
- Gemeinsames Layout (Kopf, Footer, Umami-Zeile einmal mit `data-domains` nur für die Live-Domains, Canonical auf `.html`, Favicons).
- Jahreszeit über `html[data-season]` aus dem Datum, per `?season=` testbar, Standard ohne JavaScript Herbst, 12 Tests mit Grenzdaten.
- Content Collections `tours` (mit `kind: tour/ziel`), `videos`, `stories`, `events`, `projects` mit Zod-Schemas. Fehlerhafte Einträge brechen den Build. Beispieleinträge nur aus echten Daten.
- Prüfungen (ersetzen das alte `verify.js`): `check:content` (Slugs, Dateien, Verweise, GPX-Länge gegen Angabe, Bildbudget, kein GPS in Originalbildern) und `check:dist` (Metadaten, Umami genau einmal, kein iFrame, keine Fremdanfrage, tote Links, Bild-Attribute, Bildgrößen, Lizenztext der Schrift). Die CI führt Tests, beide Prüfungen und den Build vor jedem Deploy aus.
- Impressum und Datenschutz als Modals auf der Startseite wie auf der alten Seite (Text 1:1 aus `src/legal/`). `/#impressum` und `/#datenschutz` öffnen das Modal, Footer-Links auf jeder Seite. Anker-Skript für die alten Inhaltsanker (Redirect, sobald die Zielseiten live sind).
- Bildpipeline: Originale in `src/assets/images/`, Komponente `ContentImage` (AVIF mit WebP-Ersatz, 480–1600 px, `width`/`height`, lazy, Alt Pflicht), Import-Skript `scripts/import-image.mjs` (verkleinert, entfernt alle Metadaten einschließlich GPS), Entwicklungsseite `dev-bilder` (nur Staging).
- `CLAUDE.md` mit den Entscheidungen von Björn, Regeln und Arbeitsweise für den Neubau.
- 58 Tests (Jahreszeit, Schemas, Prüfregeln, Anker, Bilder).

### Nachbesserungen nach dem Review zu M1 (30.10.2026)
- **Fremdanfragen-Prüfung neu gefasst** (Gegenprobe statt Aufzählung): erkennt jetzt `srcset`, `poster`, `<object>`, `preconnect`/`dns-prefetch`/`preload`, `//host`, Großschreibung, einfache und fehlende Anführungszeichen, `<form action>`, `@import`, Adressen in Inline-Skripten und alle gebauten CSS-Dateien.
- Umami-Zeile darf nur noch die vier vorgesehenen Attribute haben.
- `public/robots.txt` mit `Disallow: /` entfernt (sie hätte beim Cutover die Live-Seite gesperrt). `check:dist` bricht beim Live-Build ab, wenn eine `robots.txt` die ganze Seite sperrt.
- Link auf noch nicht migrierte Seiten (`PENDING`) ist beim Live-Build ein Fehler, nur im Staging erlaubt.
- Rechtstext von Impressum und Datenschutz per Prüfsumme gegen Abdriften gesichert (`tests/legal.test.mjs`, verglichen mit der Live-Seite).
- `build:live` und `check:live` laufen plattformunabhängig (auch unter Windows-PowerShell), Pfade in den Skripten mit `fileURLToPath`.
- CI läuft auch bei Pull Requests (ohne Deployment), Hilfsfunktion `withBase` für interne Adressen aus Inhalten.
- Alt-Text des 3-Türme-Bildes kennzeichnet es als Illustration, leerer Ordner `public/images` und ein veralteter Testpfad entfernt. 66 Tests.

### Geändert
- Gegenüber der Live-Seite: Tailwind lokal statt CDN, kein `img.youtube.com`-Fallback für Video-Vorschaubilder, Prüfungen in CI statt `verify.js`.

### Hinweise
- Videos bleiben reine Links mit lokalem Vorschaubild (kein Embed). Impressum und Datenschutz bleiben Modals, die Play-Store-Einträge und Apps verweisen unverändert auf `/#datenschutz` bzw. das Impressum.
- Der Datenschutztext verlinkt auf `pfadwerk.html`, das erst mit AP2.5 migriert wird (in `scripts/check-dist.mjs` als geplant markiert).

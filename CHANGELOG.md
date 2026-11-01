# Changelog – mitrilmo-Website 2.0 (Neubau, Staging)

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

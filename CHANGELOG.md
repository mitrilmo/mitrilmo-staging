# Changelog – mitrilmo-Website 2.0 (Neubau, Staging)

Protokoll der Änderungen am Neubau. Die alte Live-Seite hat ihr eigenes Changelog (nicht in diesem Repo).
Format pro Eintrag: Datum, dann nur zutreffende Kategorien **Neu**, **Geändert**, **Entfernt**.

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

### Geändert
- Gegenüber der Live-Seite: Tailwind lokal statt CDN, kein `img.youtube.com`-Fallback für Video-Vorschaubilder, Prüfungen in CI statt `verify.js`.

### Hinweise
- Videos bleiben reine Links mit lokalem Vorschaubild (kein Embed). Impressum und Datenschutz bleiben Modals, die Play-Store-Einträge und Apps verweisen unverändert auf `/#datenschutz` bzw. das Impressum.
- Der Datenschutztext verlinkt auf `pfadwerk.html`, das erst mit AP2.5 migriert wird (in `scripts/check-dist.mjs` als geplant markiert).

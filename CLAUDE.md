# Instruktionen für Claude Code – mitrilmo-Website 2.0 (Neubau, Staging)

## Projekt

Neubau der Website für den YouTube-Kanal **mitrilmo** (Outdoor, Wandern, Radfahren, Bergisches Land) mit **Astro**, Content Collections und lokal gebautem Tailwind. Dieses Repo ist das **Staging** (`mitrilmo/mitrilmo-staging`, Test-URL `https://mitrilmo.github.io/mitrilmo-staging/`). Die alte Live-Seite liegt im Repo `mitrilmo/mitrilmo-website` (Branch `main`, bis zum Cutover unverändert; Sicherung `legacy-1.0`, Tag `vor-astro-relaunch`).

Pläne und Entscheidungen stehen im Vault `V:\MoKiWiki\02 Projekte\`: `mitrilmo-Website 2.0 - Umsetzungsplan`, `... Optimierungsplan`, `... Inventur`, `... Slug-Tabelle`, `... URL-Inventar und Weiterleitungen`. **Dort nachlesen, bevor etwas Strukturelles geändert wird.**

## Feste Entscheidungen von Björn (nicht ohne Rückfrage ändern)

- **Impressum und Datenschutz bleiben Modals auf der Startseite** (wie heute). `/#impressum` und `/#datenschutz` müssen auf `/` und `/index.html` das Modal öffnen (kein Redirect). Keine Änderung in Play Console und Apps. Unterseiten und alle 33 Stories verlinken im Footer auf `/#impressum` und `/#datenschutz`.
- **Videos sind reine Links** mit lokalem Vorschaubild (öffnen YouTube in neuem Tab). Kein Embed, kein iFrame, kein Fallback auf `img.youtube.com`. Datenschutztext bleibt unverändert.
- **Keine Search Console.** Beobachtung über Umami.
- **Hub „Geschichten" = `/geschichten.html`**, die 33 Stories bleiben unter `/stories/<name>.html` (URLs unverändert).
- **Zweite Welle nach dem Cutover:** Tiere am Wegweiser, Partikel, Parallax, RSS, weitere Skills.

## Technik und Regeln

- **Astro** mit `build.format: 'file'`: Seiten sind `.html`, Links **ohne** Schrägstrich am Ende (`/x/` liefert auf GitHub Pages 404). Canonical immer auf die `.html`-Adresse.
- **Basispfad:** Alle Links über `import.meta.env.BASE_URL` (Staging `/mitrilmo-staging`, Live `/`). **Interne Adressen aus Inhalten** (z. B. `projects/*.md`, `links[].href: /pfadwerk.html`) gelten relativ zum Site-Root und werden beim Ausgeben mit `withBase(import.meta.env.BASE_URL, href)` aus `src/lib/url.js` versehen.
- **Live bauen und prüfen** (läuft auch unter Windows/PowerShell): `npm run build:live`, `npm run check:live`. Der Live-Check blockiert bewusst, solange es `dev-*.html` oder Links auf noch nicht migrierte Seiten (`PENDING`) gibt.
- **`robots.txt`:** Im Staging gibt es keine (im Unterpfad wirkungslos, es schützt nur `noindex`). Die Live-`robots.txt` mit `Sitemap:`-Zeile kommt in AP4.1. `check:dist` bricht beim Live-Build ab, wenn sie die ganze Seite sperrt (`Disallow: /`).
- **Tailwind lokal gebaut** (`@tailwindcss/vite`), **kein CDN**. Farben als Tokens in `src/styles/global.css`.
- **Schriften:** nur frei lizenzierte (OFL/Apache), lokal gehostet, Lizenztext im selben Ordner (`public/fonts/OFL-Inter.txt`). Keine externen Schriftdienste. Neue Schriften nur nach Rückfrage. Ausweichkette `system-ui, sans-serif`.
- **Kein externes CSS/JS** außer dem Umami-Skript (selbst gehostet auf MOBRAIN, steht einmal im Layout `src/layouts/Base.astro`, mit `data-domains="mitrilmo.com,www.mitrilmo.com"`, damit Staging nicht zählt).
- **Jahreszeit** über `html[data-season]`, gesetzt vom Skript im `<head>` (`src/lib/season.js`, getestet in `tests/season.test.mjs`), Testen mit `?season=winter`. Standard ohne JavaScript: Herbst. Bewegung immer mit `prefers-reduced-motion` abschaltbar.
- **Farben:** Body `#1a2520` (slate-800), Karten `#243029` (slate-700), Akzent je Jahreszeit, Logo „mitril" in `#7bbf6a` (forest-400) wie auf der Live-Seite.
- **Ton:** Deutsch, ehrlich, persönlich, kein Marketing-Sprech, kein Sponsoring. Unbekannte Angaben bleiben leer, nie erfinden.
- **Slugs** nur `a–z`, `0–9`, Bindestrich, einmal vergeben, nie ändern. Tabelle im Vault (Slug-Tabelle).
- **Keine Geheimnisse im Repo** (öffentlich): kein Mastercode der Pfadwerk-Codes, keine Schlüssel.

## Bilder

- **Originale** liegen unter `src/assets/images/tours/<slug>.jpg`, `videos/<YouTube-ID>.jpg`, `stories/…`. Im Eintrag steht der Pfad relativ zur Markdown-Datei, z. B. `image: ../../assets/images/tours/mein-slug.jpg`. Astro erzeugt beim Bauen AVIF und WebP in 480, 800, 1200 und 1600 px (nie größer als das Original, kein JPEG).
- **Neues Bild importieren:** `node scripts/import-image.mjs "<Quelle>" tours/<slug>.jpg` (verkleinert auf höchstens 2400 px, übernimmt die Ausrichtung, **entfernt alle Metadaten einschließlich GPS**, Original bleibt unverändert). Nie ein Foto direkt nach `src/assets` kopieren.
- **Ausgabe immer über `src/components/ContentImage.astro`**: Alt-Text ist Pflicht (mindestens 3 Zeichen), das erste, sichtbare Bild einer Seite bekommt `priority`, alle anderen laden erst beim Scrollen.
- **Vorschaubilder von Videos** immer lokal (`videos/<ID>.jpg`), nie von `img.youtube.com`.
- Zum Ansehen der Pipeline gibt es `src/pages/dev-bilder.astro` (nur Staging, wird beim Live-Build von `check:dist` blockiert).

## Impressum, Datenschutz und alte Anker

- Beide Texte stehen als Modals **nur auf der Startseite** (`LegalModals`), fest im HTML, ausgeblendet. `/#impressum` und `/#datenschutz` öffnen sie, Schließen entfernt den Anker. Jede Seite hat im Footer Links auf `/#impressum` und `/#datenschutz` (`check:dist` prüft das und den Text der Modals).
- Neue Unterseiten und alle Stories verlinken **nur** über diese beiden Footer-Links, nie eigene Kopien des Textes.
- Alte Inhaltsanker (`#touren`, `#videos`, `#wanderberichte` …) leiten auf die neue Seite weiter, **sobald** deren Eintrag in `src/data/nav.js` auf `live: true` steht. Tabelle in `src/lib/anchors.js`, Quelle: URL-Inventar im Vault.
- Der Datenschutztext verlinkt auf `pfadwerk.html`. Bis diese Seite migriert ist (AP2.5), steht sie in `PENDING` in `scripts/check-dist.mjs` und muss dort danach entfernt werden.

## Inhalte anlegen (Collections)

- **Tour/Ziel** (`src/content/tours/<slug>.md`): Pflicht `title`, `place`, `description`, `duration`, `difficulty`, `image`, `imageAlt`, `publishedAt`; bei `kind: tour` zusätzlich `distanceKm`. Optional: `gpx`, `coordinates`, `video`, `stories`, `komoot`, `parking`, `rating` u. a. Ein **Ziel** (`kind: ziel`) hat keine GPX. Unbekanntes bleibt leer oder `unbekannt`, **nichts erfinden**.
- **Video** (`videos/<YouTube-ID>.md`): `youtubeId`, `title`, `thumbnail` (lokal unter `src/assets/images/videos/`, nie `img.youtube.com`).
- **Story** (`stories/<bisheriger-dateiname>.md`): `title`, `description` (20–300 Zeichen), `date`, `category` (unterwegs, randnotizen, archiv), Titelbild nur mit Alt-Text.
- **Event** (`events/<slug>.md`): `endDate` ist Pflicht (danach wird der Eintrag ausgeblendet), `url` nur https.
- **Projekt** (`projects/<slug>.md`): Fortschritt nur mit `source` und `updatedAt`.
- Ein fehlerhafter Eintrag **bricht den Build ab** (Zod-Schema). Schemas ändern nur zusammen mit `tests/schemas.test.mjs`.

## Prüfungen (ersetzen das alte `verify.js`)

`npm run check` führt alles der Reihe nach aus. Die CI macht dasselbe vor jedem Deploy: `npm test`, `npm run check:content`, `npm run build`, `npm run check:dist`. Schlägt eine Prüfung an, wird **nicht** veröffentlicht. Bei Pull Requests läuft die CI ebenfalls, veröffentlicht aber nichts.

- **Rechtstext festgeschrieben:** `tests/legal.test.mjs` hält Prüfsummen von `src/legal/impressum.html` und `datenschutz.html` (verglichen mit der Live-Seite am 30.10.2026). Änderungen am Text nur nach Rücksprache mit Björn, danach Prüfsumme aktualisieren und im CHANGELOG vermerken.
- **Fremdanfragen** werden als Gegenprobe geprüft: Jede externe Adresse in einem Tag-Attribut, in `<style>`, in einem Inline-Skript oder in einer gebauten CSS-Datei ist ein Fehler. Ausgenommen sind nur anklickbare Links (`<a href>`), Canonical/alternate, Meta-Inhalte, `xmlns`, JSON-LD und die Umami-Zeile (die genau diese vier Attribute haben darf).

- **Inhalte** (`check:content`): Slug im Dateinamen, Video-Dateiname = YouTube-ID, Bilder (unter `src/assets/images/`) und GPX (unter `public/gpx/`) existieren, **Bildbudget** (Original höchstens 8 MB, Hinweis ab 3 MB, mindestens 800 px breit, **keine GPS-Daten in den Metadaten**), Verweise (Tour ↔ Video ↔ Story) zeigen auf Vorhandenes, **GPX-Länge passt zur Angabe `distanceKm`** (Toleranz 15 %, mindestens 0,3 km). Hinweis (kein Fehler): Tour mit GPX ohne Koordinaten hat keinen Pin.
- **Gebaute Seite** (`check:dist`, prüft `dist/`): jedes `<img>` mit `alt`, `width` und `height`, **keine ausgelieferte Bilddatei über 450 KB**, `dev-*.html` nur im Staging, `lang="de"`, Title, Meta Description, Canonical (https, `.html`), **Umami-Zeile genau einmal und unverändert**, `noindex` im Staging und nicht live, **kein iFrame, keine YouTube-Einbettung, kein `img.youtube.com`, kein Tailwind-CDN, keine Google Fonts, keine Fremdanfrage beim Laden** (außer Umami), **keine toten internen Links**, Lizenztext liegt neben den Schriftdateien.
- Entfallen gegenüber `verify.js` (Live-Seite): Dateiende und JS-Syntax von `index.html`, Touren-Pin-Abgleich (Pins entstehen aus den Daten).
- Neue Regeln nur zusammen mit Tests in `tests/checks.test.mjs`.

## Arbeitsweise

- **Kein Push ohne ausdrückliche Freigabe von Björn.** Staging-Push löst den Deploy nach GitHub Pages aus (nur Testseite, nicht die Live-Seite).
- Commits mit der Noreply-Adresse (`263847248+mitrilmo@users.noreply.github.com`), nie mit privater E-Mail (GitHub lehnt das ab).
- Node 24 (Astro 7 verlangt mindestens 22.23.4), im Workflow ebenfalls 24.
- Vor jedem Commit `npm test` und `npm run build`. Bei strukturellen Änderungen unabhängigen Review-Subagenten einsetzen.
- Befehle für Björn in PowerShell **einzeln** liefern, nie mit `&&` verketten, beginnend mit `cd C:\Users\garte\Desktop\mitrilmo-staging`.
- Änderungen, die nur auf der Live-Seite oder nur hier gelten, auf die **Nachzugsliste** im Umsetzungsplan (Abschnitt 2a).

## Struktur

```
src/layouts/Base.astro   gemeinsames Layout (Head, Umami, Jahreszeit, Header, Footer)
src/styles/global.css    Tailwind, Farben, Jahreszeit-Variablen
src/lib/season.js        Jahreszeitenlogik (wird in den <head> eingebettet)
src/lib/fonts.js         @font-face für Inter (mit Basispfad)
src/data/nav.js          Hauptnavigation (live:true erst, wenn die Seite existiert)
src/legal/               Text von Impressum und Datenschutz (1:1 aus der alten Seite, HTML), nur bewusst ändern
src/components/LegalModals.astro  die beiden Modals mit Skript (nur auf der Startseite eingebunden)
src/lib/anchors.js       alte Anker der Startseite: Modals öffnen bzw. Redirect auf neue Seiten (getestet in tests/anchors.test.mjs)
src/content.config.ts    Collections: tours (inkl. Ziele per kind), videos, stories, events, projects
src/schemas/             Zod-Schemas (testbar ohne Build), Pflichtfelder und Regeln je Typ
src/content/<typ>/       Eine Markdown-Datei pro Inhalt, Dateiname = Slug (Video: YouTube-ID)
src/pages/               Seiten
public/fonts/            Inter + OFL-Lizenztext
tests/                   Tests (npm test)
```

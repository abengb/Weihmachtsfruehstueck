# Weihnachtsfrühstück Schrickel

Eine kleine Web-App für das jährliche Weihnachtsfrühstück der Familie Schrickel.
Gäste geben vorab ihre Ei-Wünsche ab, die Gastgeber stellen eigene Fragen – und
kurz vor dem Frühstück erzeugt die App den Kochplan: wie viele Eier in den Topf,
und welches Ei nach wie vielen Minuten für wen herausgenommen wird.

Kein Login, kein Konto, keine E-Mails. Der Zugang läuft über zwei Links.

---

## Wie es benutzt wird

| Wer | Link | Was |
| --- | --- | --- |
| Gäste | `/e/[eventCode]` | Name eintragen, Ei aussuchen, Fragen beantworten |
| Gastgeber | `/e/[eventCode]/host?key=[hostKey]` | Übersicht, Fragen, Auswertung, Einkaufsliste |
| Gastgeber | `/e/[eventCode]/host/kochplan?key=…` | Kochplan, Druckansicht, Live-Timer |
| Gastgeber | `/e/[eventCode]/host/einstellungen?key=…` | Kochzeiten-Slider, Deadline |

Der Gast-Link wird in der WhatsApp-Gruppe geteilt. Der Gastgeber-Link enthält
einen langen, geheimen Schlüssel und bleibt bei euch.

Gäste erkennt die App am Namen. Beim ersten Eintragen landet eine `guestId` im
`localStorage`, damit beim nächsten Öffnen direkt die eigenen Angaben dastehen.
Wer versehentlich als jemand anders drin ist, klickt auf „Ich bin nicht Anna?“.

Bis zur Deadline darf jeder alles ändern. Danach ist gesperrt – die Gastgeber
können jederzeit wieder entsperren.

---

## Der Kochplan

Prinzip: **alle Eier gleichzeitig ins sprudelnd kochende Wasser, gestaffelt
herausnehmen.** Die Zeit läuft ab dem Moment des Eintauchens.

Basiszeiten für Größe M bei Zimmertemperatur:

| | Zeit |
| --- | --- |
| weich | 4:30 |
| wachsweich | 6:30 |
| hart | 9:30 |

Zuschläge: Kühlschrankkalt **+1:00**, Größe S **−0:30**, L **+0:30**, XL **+1:00**.

Die Werte stehen als Standard in [`src/lib/eggTiming.ts`](src/lib/eggTiming.ts)
und lassen sich pro Event über die Einstellungsseite per Slider nachjustieren.

Jedes Ei bekommt eine Nummer, die mit Bleistift auf die Schale kommt. Ab 13 Eiern
plant die App automatisch mehrere Töpfe und verteilt gleichmäßig (13 Eier werden
7 + 6, nicht 12 + 1). Rührei, Spiegelei und pochierte Eier zählen nicht in den
Topf, sondern stehen in einem eigenen Pfannen-Abschnitt.

**Live-Timer:** „Timer starten“ heißt, die Eier sind jetzt im Wasser. Es läuft
ein Vollbild-Countdown zur nächsten Entnahme, darunter die Folgeschritte.
20 Sekunden vorher und exakt zum Entnahmezeitpunkt kommt ein Ton (Web Audio API,
kein Sound-Datei-Download) plus Vibration. Das Display bleibt per Screen Wake
Lock an, Pause und Zurücksetzen gibt es, und der Timerstand übersteht ein
Neuladen der Seite.

**Druckansicht:** Der Kochplan lässt sich sauber ausdrucken und an den
Kühlschrank hängen – Knöpfe und Navigation werden dabei ausgeblendet.

---

## Einrichten

Voraussetzungen: Node 22, eine Postgres-Datenbank (Neon oder lokal).

```bash
npm install
cp .env.example .env        # DATABASE_URL und DIRECT_URL eintragen
npx prisma migrate deploy   # Schema anlegen
npm run seed                # Beispiel-Event mit 8 Gästen
npm run dev
```

`npm run seed` gibt am Ende den Gast- und den Gastgeber-Link aus.

### Umgebungsvariablen

| Variable | Pflicht | Wofür |
| --- | --- | --- |
| `DATABASE_URL` | ja | Postgres-Verbindung der App. Bei Neon die **gepoolte** URL (`…-pooler.…`) |
| `DIRECT_URL` | ja | Direkte Verbindung ohne Pooler – Prisma braucht sie für Migrationen |
| `NETLIFY_DATABASE_URL` | – | Setzt Netlify Database selbst; wird automatisch als Ersatz für `DATABASE_URL` erkannt |
| `NETLIFY_DATABASE_URL_UNPOOLED` | – | dito für `DIRECT_URL` (bevorzugt für Migrationen) |
| `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `DATABASE_URL_UNPOOLED` | – | Weitere gängige Namen, werden ebenfalls erkannt |
| `APP_URL` | – | Nur für die Link-Ausgabe des Seed-Skripts |
| `SEED_EVENT_CODE`, `SEED_HOST_KEY` | – | Feste Codes fürs Seed-Event statt zufälliger |

### Befehle

| Befehl | Was |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktionsbuild |
| `npm test` | Unit-Tests (Vitest) |
| `npm run seed` | Beispiel-Event anlegen |
| `npx prisma migrate dev` | Neue Migration aus Schema-Änderungen |
| `npx prisma studio` | Datenbank ansehen |

---

## Deployen auf Netlify

### Weg A: per Knopfdruck über GitHub Actions (nichts zu installieren)

Einmalig zwei Repository-Secrets anlegen unter
*Settings → Secrets and variables → Actions → New repository secret*:

| Secret | Woher |
| --- | --- |
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → Personal access tokens → New access token |
| `DATABASE_URL` | Kostenloses Projekt auf [neon.tech](https://neon.tech), dann die **gepoolte** Verbindung (`…-pooler.…neon.tech`) kopieren |

Optional: `DIRECT_URL` (dieselbe Neon-URL ohne `-pooler`, für die Migrationen)
und `NETLIFY_SITE_ID`, falls die Site schon existiert.

Dann *Actions → „Auf Netlify veröffentlichen" → Run workflow*. Der Workflow
legt die Site an, setzt die Datenbank-Variablen, baut, deployt, prüft die
Live-Seite und legt das Event an. Live-URL, Gast-Link und Gastgeber-Link
stehen danach in der Zusammenfassung des Laufs.

> Die Zusammenfassung sehen alle mit Lesezugriff aufs Repository – der
> Gastgeber-Link steht dort im Klartext. Wer das nicht möchte, legt das Event
> stattdessen auf der Startseite an; dann bleiben die Codes im Browser.

### Weg B: auf dem eigenen Rechner, mit öffentlichem Link

Kein Netlify, kein Konto – die App läuft auf deinem Rechner und ist über einen
Tunnel von außen erreichbar. Braucht Docker und Node 22:

```bash
bash scripts/lokal-mit-link.sh
```

Das Skript startet Postgres in Docker, spielt das Schema ein, legt das
Beispiel-Event an, baut und startet die App und öffnet einen Tunnel. Am Ende
stehen der öffentliche Gast- und Gastgeber-Link auf dem Bildschirm.

Der Link lebt nur, solange das Fenster offen ist und der Rechner wach bleibt –
gut zum Zeigen und Ausprobieren, nichts für die Wochen vor dem Frühstück.
Schöner wird der Tunnel mit `brew install cloudflared` (sonst springt das
Skript auf localtunnel um, das Besuchern einmal eine Zwischenseite zeigt).

### Weg C: lokal deployen, ein Befehl

Ein Befehl, der alles durchgeht – Anmeldung, Site, Datenbank, Deploy und das
Anlegen des Events:

```bash
bash scripts/deploy.sh
```

Er hält nur an, wenn er dich braucht: einmal für die Netlify-Anmeldung im
Browser und, falls noch keine Datenbank existiert, für die Neon-Anbindung.

### Weg D: von Hand


```bash
npx netlify-cli login
npx netlify-cli sites:create --name weihnachtsfruehstueck-schrickel
npx netlify-cli link --name weihnachtsfruehstueck-schrickel
```

Dann die Datenbank – am einfachsten über Netlify Database im Dashboard unter
*Project configuration → Data & Storage → Database*. Netlify legt sie an und
setzt `NETLIFY_DATABASE_URL` selbst; die App erkennt das.

Kommt die Datenbank nicht an, zeigt das Build-Log unter „Sichtbare
Datenbank-Variablen" (nur Namen, keine Passwörter), was überhaupt ankommt.

Alternativ ein eigenes Neon-Projekt auf [neon.tech](https://neon.tech):

```bash
npx netlify-cli env:set DATABASE_URL "postgresql://…-pooler.…neon.tech/neondb?sslmode=require"
npx netlify-cli env:set DIRECT_URL   "postgresql://….neon.tech/neondb?sslmode=require"
```

Und deployen:

```bash
npx netlify-cli deploy --build --prod
```

Der Build läuft über [`scripts/netlify-build.sh`](scripts/netlify-build.sh):
Variablen zurechtlegen → `prisma generate` → `prisma migrate deploy` →
`next build`. Die Migration passiert also bei jedem Deploy automatisch.
`@netlify/plugin-nextjs` wird über [`netlify.toml`](netlify.toml) eingebunden.

Danach das Event anlegen: Live-URL öffnen → „Neues Frühstück anlegen“. Die
Seite zeigt anschließend beide Links zum Kopieren.

### Wenn es klemmt

Drei Dinge haben beim ersten Aufsetzen echte Zeit gekostet. Falls sie wieder
auftauchen, hier die Erkennungsmerkmale:

**„Skipped due to account credit usage exceeded“** — Netlify führt den Build gar
nicht aus, das Guthaben des Kontos ist aufgebraucht. Sichtbar nur in der
Fehlermeldung des Deploys, nicht im Build-Log (das es dann nicht gibt). Der
Reparatur-Workflow erkennt das und baut ersatzweise auf dem GitHub-Runner, was
kein Build-Kontingent braucht.

**„🟢 Netlify Database is enabled“, aber nirgends eine Verbindung** — „enabled“
heißt nur, dass das Feature für das Projekt freigeschaltet ist. Ob wirklich eine
Datenbank daranhängt, verrät

```bash
curl -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  https://api.netlify.com/api/v1/sites/<site-id>/service-instances
```

Kommt `[]` zurück, existiert keine Instanz. `netlify db init` hilft dabei nicht:
es richtet nur eine lokale Wegwerf-Datenbank ein (`postgres://localhost:…`).

**Prisma meldet `P1013: The scheme is not recognized`** — der Verbindungs-String
fängt nicht mit `postgresql://` an. Neon zeigt ihn als fertigen Befehl an:

```
psql 'postgresql://…'
```

Wer die ganze Zeile kopiert, hat `psql ` und die Anführungszeichen mit im Wert.
Der Workflow entfernt solche Beigaben inzwischen selbst.

---

## Aufbau

```
prisma/
  schema.prisma          Event, Guest, EggOrder, Question, Answer, Wunsch
  seed.ts                Beispiel-Event mit 8 Gästen und 2 Fragen
src/
  app/
    page.tsx                                Startseite, Event anlegen
    e/[eventCode]/page.tsx                  Gäste-Seite
    e/[eventCode]/host/page.tsx             Dashboard
    e/[eventCode]/host/kochplan/page.tsx    Kochplan + Timer
    e/[eventCode]/host/einstellungen/       Kochzeiten, Deadline
    api/…                                   Route Handler (JSON)
  components/
    GastApp.tsx            Gäste-Formular mit automatischem Speichern
    HostApp.tsx            Dashboard, Fragen, Auswertung, Einkaufsliste
    KochplanAnsicht.tsx    Topf-Plan, Druckansicht, Live-Timer
    EinstellungenApp.tsx   Slider für die Kochzeiten
    Illustrationen.tsx     Alle SVGs (keine externen Assets)
    Wespe.tsx              Das Easter Egg
    Rahmen.tsx, ui.tsx     Kopf, Fuß, Karten, Kacheln, Stepper
  lib/
    eggTiming.ts           Kochzeiten, Topf-Aufteilung, Kochplan, Einkaufsliste
    eggTiming.test.ts      28 Unit-Tests
    eventData.ts           Laden, Zugriffsprüfung, DTOs
    validierung.ts         Eingabeprüfung der API
    browserSpeicher.ts     localStorage/sessionStorage als React-Store
```

Die Kochzeit-Logik in `eggTiming.ts` kennt weder Prisma noch React – deshalb
lässt sie sich ohne Datenbank testen.

### Tests

```bash
npm test
```

Deckt ab: Basiszeiten, Zuschläge für Größe und Temperatur, pro Event
angepasste Werte, Untergrenze, Formatierung, Topf-Aufteilung (inklusive der
Invariante, dass die Gesamtzahl stimmt und kein Topf überläuft), Nummerierung
über mehrere Töpfe, Zusammenfassen gleichzeitiger Entnahmen, Trennung von Topf
und Pfanne, Sonderwünsche und die Einkaufsliste mit Bruch-Reserve.

---

## Easter Eggs

### Die versteckte Wespe

Es ist September. Irgendwo sitzt eine Wespe.

Sie ist etwa 20 Pixel groß, ein eigenes SVG, kein Emoji – und sie sitzt immer am
**Rand einer Illustration**, nie mitten im Weg. Es gibt keinen Tooltip und keinen
Hinweis im Text. Bei jedem Seitenaufruf wählt sie zufällig einen der möglichen
Plätze und bleibt dann still sitzen.

Mögliche Sitzplätze (definiert über `<WespenPlatz>` in den Komponenten):

| Wo | Genau |
| --- | --- |
| Kopfzeile, überall | auf dem großen roten Apfel im Zweig |
| Fußzeile, überall | auf dem Mühlrad der Kupfermühle in der Glinde-Silhouette |
| Fußzeile, überall | auf dem Rand des Marmeladenglases |
| Startseite | auf einer Kerze im Adventsgesteck |
| Gäste-Seite | auf der Weihnachtskugel neben den Sonderwünschen (ab Tablet-Breite) |
| Gäste-Seite | auf dem Eierbecher am Kaffeetisch ganz unten |
| Gastgeber-Seite | auf der roten Lampe der Lichterkette (ab Tablet-Breite) |
| Gastgeber-Seite | am Rand der Sonnenblume ganz unten |

**Auf der Kochplan- und der Timer-Seite taucht sie nicht auf** – beim Kochen soll
nichts ablenken. Technisch: dort wird der `WespenProvider` gar nicht eingebunden.

Wer sie anklickt, verscheucht sie: kurze Flieg-weg-Animation, ein dezenter Toast
„Erwischt. Deckel drauf.“, danach ist sie für diese Browser-Session weg. Im
`localStorage` zählt `wespenAbwehr` mit, wie oft du sie erwischt hast. Der Wert
wird nirgends angezeigt – in der Konsole nachsehen:

```js
localStorage.getItem('wespenAbwehr')
```

Zum Zurückholen: `sessionStorage.removeItem('wespeVerscheucht')` und neu laden.

### Kleinigkeiten am Rande

Auf dem gedeckten Kaffeetisch steht eine Kerze, die niemand anzündet – es hat ja
24 Grad. Und im Timer steht am Ende nicht „Fertig“, sondern „Alles raus.“

---

## Design

„Weihnachten im September in Glinde“ – weihnachtlich, aber unübersehbar aus der
Zeit gefallen. Tannengrün und Beerenrot treffen auf Pflaume, Nachmittagsgelb,
Apfelgrün und Cremeweiß. Kein Eisblau, kein Silber, kein Schnee, keine
animierten Schneeflocken.

Überschriften in Fraunces (warme Serif), Fließtext in Inter. Große Touch-Ziele,
runde Karten, mobile-first.

Alle Illustrationen sind eigene Inline-SVGs ohne externe Assets: Tannenzweig
neben Apfelbaumzweig, Weihnachtskugel im Gartenbaum, Lichterkette über dem
Gartenzaun, gedeckter Kaffeetisch draußen, Astern und Sonnenblumen neben dem
Adventsgesteck.

**Glinde** steckt in der Fußzeile: eine reduzierte Silhouette mit der
Kupfermühle samt Mühlrad, der Glinder Au davor, Villa Bode, dem Rathaus und dem
Brunnen am Marktplatz, dem Bürgerhaus Marcellin-Verbe und der Skulptur
„Balance“. Das Mühlrad steht im Stadtwappen; die Mühle wurde 1229 erstmals
urkundlich erwähnt und ist seit 1985 Museum. Im Kopf steht die Zeile
„Glinde · Weihnachtsfrühstück im September“.

---

## Technik

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Prisma 6 · Postgres
(Neon) · Vitest · Netlify mit `@netlify/plugin-nextjs`.

Keine Auth-Bibliothek. Der Gastgeber-Schlüssel wird serverseitig
zeitkonstant verglichen (`istHost` in `src/lib/eventData.ts`); Gast- und
Gastgeber-Links tragen `noindex` und `Referrer-Policy: no-referrer`, damit der
Schlüssel nicht als Referrer nach außen wandert.

Gäste-Seite und Gastgeber-Seite aktualisieren sich per Polling (15 bzw. 10
Sekunden) – kein WebSocket nötig. Gespeichert wird automatisch, gebündelt kurz
nach der letzten Eingabe, mit sichtbarem „Gespeichert ✓“.

**Bekannter Hinweis:** `npm audit` meldet eine Schwachstelle in `deepmerge-ts`,
einer Abhängigkeit der Prisma-CLI (`@prisma/config`). Sie betrifft nur das
Kommandozeilen-Werkzeug beim Build, nicht die laufende App.

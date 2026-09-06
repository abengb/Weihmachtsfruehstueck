#!/usr/bin/env bash
#
# Einmal ausführen, dann steht die App live auf Netlify.
#
#   bash scripts/deploy.sh
#
# Das Skript legt die Netlify-Site an, sorgt für eine Neon-Datenbank,
# deployt und legt am Ende das Event "Weihnachtsfrühstück Schrickel" an.
# Es fragt nur dann nach, wenn es ohne dich nicht weiterkommt.
#
set -euo pipefail

SITE_NAME="${SITE_NAME:-weihnachtsfruehstueck-schrickel}"
NETLIFY="npx --yes netlify-cli@latest"

blau() { printf '\n\033[1;36m%s\033[0m\n' "$*"; }
gelb() { printf '\033[1;33m%s\033[0m\n' "$*"; }

cd "$(dirname "$0")/.."

# --- 1. Anmeldung ----------------------------------------------------------
blau "1/6  Netlify-Anmeldung"
if [ -n "${NETLIFY_AUTH_TOKEN:-}" ]; then
  echo "NETLIFY_AUTH_TOKEN gefunden – keine Anmeldung nötig."
elif $NETLIFY status >/dev/null 2>&1; then
  echo "Bereits angemeldet."
else
  gelb "Es öffnet sich gleich der Browser. Bitte einmal bestätigen."
  $NETLIFY login
fi

# --- 2. Site ---------------------------------------------------------------
blau "2/6  Netlify-Site"
if [ -f .netlify/state.json ]; then
  echo "Site ist schon verknüpft."
else
  $NETLIFY sites:create --name "$SITE_NAME" --disable-linking || {
    gelb "Name '$SITE_NAME' ist vergeben – hänge eine Zahl an, z. B.:"
    gelb "  SITE_NAME=${SITE_NAME}-2 bash scripts/deploy.sh"
    exit 1
  }
  $NETLIFY link --name "$SITE_NAME"
fi

# --- 3. Datenbank ----------------------------------------------------------
blau "3/6  Datenbank"
vorhanden=$($NETLIFY env:list --plain 2>/dev/null || $NETLIFY env:list 2>/dev/null || true)

if echo "$vorhanden" | grep -qE '(DATABASE_URL|NETLIFY_DATABASE_URL)'; then
  echo "Datenbank-Variable ist gesetzt."
elif [ -n "${DATABASE_URL:-}" ]; then
  echo "Übernehme DATABASE_URL aus der Umgebung."
  $NETLIFY env:set DATABASE_URL "$DATABASE_URL"
  $NETLIFY env:set DIRECT_URL "${DIRECT_URL:-$DATABASE_URL}"
else
  gelb "Es fehlt noch eine Postgres-Datenbank. Zwei Wege:"
  gelb ""
  gelb "  A) Netlifys Neon-Integration (empfohlen, ein Klick):"
  gelb "     Netlify-Dashboard → deine Site → Extensions → 'Neon' installieren."
  gelb "     Netlify legt die Datenbank an und setzt NETLIFY_DATABASE_URL selbst."
  gelb ""
  gelb "  B) Eigenes Neon-Projekt auf https://neon.tech anlegen und hier"
  gelb "     die beiden Verbindungen einsetzen:"
  gelb "       netlify env:set DATABASE_URL \"postgresql://…-pooler…\""
  gelb "       netlify env:set DIRECT_URL   \"postgresql://…\"   # ohne -pooler"
  gelb ""
  read -r -p "Fertig? Dann Enter zum Weitermachen (oder Strg-C zum Abbrechen). " _
fi

# --- 4. Deployen -----------------------------------------------------------
blau "4/6  Deployen"
$NETLIFY deploy --build --prod

# --- 5. URL holen ----------------------------------------------------------
blau "5/6  Live-URL"
URL=$($NETLIFY status --json 2>/dev/null | node -e \
  'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const j=JSON.parse(d);console.log(j.siteData?.ssl_url||j.siteData?.url||"")}catch{console.log("")}})')
[ -z "$URL" ] && URL="https://${SITE_NAME}.netlify.app"
echo "$URL"

# --- 6. Event anlegen ------------------------------------------------------
blau "6/6  Event 'Weihnachtsfrühstück Schrickel' anlegen"
ANTWORT=$(curl -sS -X POST "$URL/api/events" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Weihnachtsfrühstück Schrickel","datum":"'"$(date -u -d '+14 days' +%Y-%m-%d 2>/dev/null || date -u -v+14d +%Y-%m-%d)"'T09:00:00.000Z"}')

echo "$ANTWORT" | node -e '
let d = ""
process.stdin.on("data", (c) => (d += c)).on("end", () => {
  const url = process.argv[1]
  try {
    const j = JSON.parse(d)
    if (!j.eventCode) throw new Error(j.fehler ?? "unbekannt")
    console.log("\n\x1b[1;32mFertig.\x1b[0m\n")
    console.log("  Live-URL:        " + url)
    console.log("  Gast-Link:       " + url + j.gastLink)
    console.log("  Gastgeber-Link:  " + url + j.hostLink)
    console.log("\nDen Gast-Link in die WhatsApp-Gruppe, den Gastgeber-Link fuer euch behalten.\n")
  } catch (e) {
    console.log("\nDeploy steht, aber das Event konnte nicht angelegt werden: " + e.message)
    console.log("Leg es von Hand an: " + url + " → 'Neues Fruehstueck anlegen'\n")
  }
})' "$URL"

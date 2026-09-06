#!/usr/bin/env bash
#
# App auf dem eigenen Rechner starten und von außen erreichbar machen.
#
#   bash scripts/lokal-mit-link.sh
#
# Startet eine Postgres-Datenbank in Docker, spielt das Schema ein, legt das
# Beispiel-Event an, baut die App, startet sie – und öffnet zum Schluss einen
# Tunnel ins Internet. Am Ende stehen der öffentliche Gast- und Gastgeber-Link
# auf dem Bildschirm.
#
# Voraussetzungen: Docker und Node 22.
# Zum Beenden Strg-C – dann wird alles wieder aufgeräumt.
#
# Achtung: Der Link lebt nur, solange dieses Fenster offen ist und der Rechner
# wach bleibt. Für etwas Dauerhaftes siehe README, Abschnitt "Deployen".
#
set -euo pipefail

CONTAINER="wf-postgres"
PORT="${PORT:-3000}"
DB_PORT="${DB_PORT:-55432}"

blau() { printf '\n\033[1;36m%s\033[0m\n' "$*"; }
gelb() { printf '\033[1;33m%s\033[0m\n' "$*"; }
rot()  { printf '\033[1;31m%s\033[0m\n' "$*"; }

cd "$(dirname "$0")/.."

aufraeumen() {
  blau "Räume auf"
  [ -n "${TUNNEL_PID:-}" ] && kill "$TUNNEL_PID" 2>/dev/null || true
  [ -n "${APP_PID:-}" ] && kill "$APP_PID" 2>/dev/null || true
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  echo "Fertig. Bis zum nächsten Mal."
}
trap aufraeumen EXIT INT TERM

# --- 0. Voraussetzungen ----------------------------------------------------
command -v docker >/dev/null || { rot "Docker fehlt. Installier Docker Desktop und starte es."; exit 1; }
docker info >/dev/null 2>&1 || { rot "Docker läuft nicht. Starte Docker Desktop."; exit 1; }
command -v node >/dev/null || { rot "Node fehlt. Installier Node 22."; exit 1; }

# --- 1. Datenbank ----------------------------------------------------------
blau "1/6  Datenbank starten"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=fruehstueck \
  -e POSTGRES_DB=weihnachtsfruehstueck \
  -p "$DB_PORT":5432 postgres:16-alpine >/dev/null
echo "Postgres läuft auf Port $DB_PORT."

export DATABASE_URL="postgresql://postgres:fruehstueck@localhost:${DB_PORT}/weihnachtsfruehstueck"
export DIRECT_URL="$DATABASE_URL"

printf 'Warte auf die Datenbank'
for _ in $(seq 1 40); do
  if docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then echo " – da."; break; fi
  printf '.'
  sleep 1
done

# --- 2. Abhängigkeiten -----------------------------------------------------
blau "2/6  Abhängigkeiten"
[ -d node_modules ] || npm ci

# --- 3. Schema und Beispieldaten -------------------------------------------
blau "3/6  Schema einspielen"
npx prisma migrate deploy

blau "4/6  Beispiel-Event anlegen"
npx tsx prisma/seed.ts

# --- 4. App bauen und starten ----------------------------------------------
blau "5/6  App bauen und starten"
npx next build
npx next start -p "$PORT" >/tmp/wf-app.log 2>&1 &
APP_PID=$!

printf 'Warte auf die App'
for _ in $(seq 1 40); do
  if curl -sS -o /dev/null "http://localhost:$PORT/" 2>/dev/null; then echo " – läuft."; break; fi
  printf '.'
  sleep 1
done

# --- 5. Tunnel nach außen ---------------------------------------------------
blau "6/6  Tunnel ins Internet"

OEFFENTLICH=""

if command -v cloudflared >/dev/null; then
  echo "Nutze cloudflared."
  cloudflared tunnel --url "http://localhost:$PORT" >/tmp/wf-tunnel.log 2>&1 &
  TUNNEL_PID=$!
  for _ in $(seq 1 30); do
    OEFFENTLICH=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/wf-tunnel.log | head -1 || true)
    [ -n "$OEFFENTLICH" ] && break
    sleep 1
  done
else
  gelb "cloudflared nicht gefunden – nutze localtunnel."
  gelb "(Schöner wird es mit: brew install cloudflared)"
  npx --yes localtunnel --port "$PORT" >/tmp/wf-tunnel.log 2>&1 &
  TUNNEL_PID=$!
  for _ in $(seq 1 30); do
    OEFFENTLICH=$(grep -oE 'https://[a-z0-9-]+\.loca\.lt' /tmp/wf-tunnel.log | head -1 || true)
    [ -n "$OEFFENTLICH" ] && break
    sleep 1
  done
fi

if [ -z "$OEFFENTLICH" ]; then
  rot "Der Tunnel kam nicht zustande. Log: /tmp/wf-tunnel.log"
  gelb "Die App läuft trotzdem – im Browser: http://localhost:$PORT"
  OEFFENTLICH="http://localhost:$PORT"
fi

# --- 6. Links ---------------------------------------------------------------
CODES=$(docker exec "$CONTAINER" psql -U postgres -d weihnachtsfruehstueck -tAF'|' \
  -c "select \"eventCode\", \"hostKey\" from \"Event\" order by \"createdAt\" desc limit 1")
CODE="${CODES%%|*}"
KEY="${CODES##*|}"

printf '\n\033[1;32m═══ Fertig ═══\033[0m\n\n'
printf '  Öffentlich:      %s\n' "$OEFFENTLICH"
printf '  Gast-Link:       %s/e/%s\n' "$OEFFENTLICH" "$CODE"
printf '  Gastgeber-Link:  %s/e/%s/host?key=%s\n' "$OEFFENTLICH" "$CODE" "$KEY"
printf '  Kochplan:        %s/e/%s/host/kochplan?key=%s\n\n' "$OEFFENTLICH" "$CODE" "$KEY"

if [[ "$OEFFENTLICH" == *loca.lt* ]]; then
  gelb "localtunnel zeigt Besuchern einmal eine Zwischenseite. Das Passwort dort"
  gelb "ist deine öffentliche IP – die steht auf https://loca.lt/mytunnelpassword"
  gelb "Mit cloudflared entfällt das."
  echo
fi

gelb "Solange dieses Fenster offen ist, ist der Link erreichbar."
gelb "Strg-C beendet alles und räumt auf."
echo

wait "$APP_PID"

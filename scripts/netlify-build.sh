#!/usr/bin/env bash
# Build-Schritt für Netlify.
#
# Die Datenbank-URL kann unter verschiedenen Namen ankommen:
#   - selbst gesetzt:            DATABASE_URL / DIRECT_URL
#   - Netlify Database (Neon):   NETLIFY_DATABASE_URL / NETLIFY_DATABASE_URL_UNPOOLED
#   - andere Anbieter:           POSTGRES_URL / POSTGRES_PRISMA_URL
# Hier wird alles auf die Namen gebracht, die prisma/schema.prisma erwartet.
#
# Fehlt die Datenbank noch, bricht der Build NICHT ab: die Seite geht online und
# erklärt dort selbst, was noch fehlt. Nach dem Verbinden reicht ein
# "Trigger deploy".
set -euo pipefail

# --- Diagnose --------------------------------------------------------------
# Nur Namen, nie Werte: Verbindungs-Strings enthalten das Passwort, und
# Build-Logs sind für alle sichtbar, die Zugriff auf die Site haben.
echo "→ Sichtbare Datenbank-Variablen in diesem Build:"
gefunden=0
for name in DATABASE_URL DIRECT_URL \
            NETLIFY_DATABASE_URL NETLIFY_DATABASE_URL_UNPOOLED \
            DATABASE_URL_UNPOOLED POSTGRES_URL POSTGRES_PRISMA_URL; do
  wert="${!name:-}"
  if [ -n "$wert" ]; then
    echo "     $name  – gesetzt (${#wert} Zeichen)"
    gefunden=1
  fi
done
if [ "$gefunden" = "0" ]; then
  echo "     keine."
  echo "   Alle Variablennamen, die überhaupt nach Datenbank aussehen:"
  # Wieder nur Namen. Findet auch Varianten, die hier noch niemand kennt.
  env | cut -d= -f1 | grep -E '(DATABASE|POSTGRES|NEON)|^PG[A-Z]+$' | sort -u | sed 's/^/     /' || echo "     (auch keine)"
fi

# --- Auflösen ---------------------------------------------------------------
export DATABASE_URL="${DATABASE_URL:-${NETLIFY_DATABASE_URL:-${POSTGRES_PRISMA_URL:-${POSTGRES_URL:-${NETLIFY_DATABASE_URL_UNPOOLED:-${DATABASE_URL_UNPOOLED:-}}}}}}"
# Migrationen laufen am besten über eine direkte Verbindung ohne Pooler.
export DIRECT_URL="${DIRECT_URL:-${NETLIFY_DATABASE_URL_UNPOOLED:-${DATABASE_URL_UNPOOLED:-$DATABASE_URL}}}"

if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo "┌──────────────────────────────────────────────────────────────┐"
  echo "│  Noch keine Datenbank verbunden.                             │"
  echo "│                                                              │"
  echo "│  Die Seite wird trotzdem veröffentlicht und erklärt dort,     │"
  echo "│  was zu tun ist. Zum Fertigstellen im Netlify-Dashboard:      │"
  echo "│                                                              │"
  echo "│    1. Project configuration → Data & Storage → Database      │"
  echo "│       → 'Create a database' (Netlify Database)               │"
  echo "│    2. Deploys → Trigger deploy                               │"
  echo "│                                                              │"
  echo "│  Steht die Datenbank schon und diese Meldung kommt trotzdem: │"
  echo "│  siehe die Liste der sichtbaren Variablen oben. Notfalls die │"
  echo "│  Verbindung von Hand unter Environment variables als         │"
  echo "│  DATABASE_URL eintragen.                                     │"
  echo "└──────────────────────────────────────────────────────────────┘"
  echo ""

  # Prisma braucht zum Erzeugen des Clients irgendeine syntaktisch gültige URL.
  # Verbunden wird damit nie – ohne echte Datenbank zeigt die App den Hinweis.
  DATABASE_URL="postgresql://platzhalter:platzhalter@localhost:5432/platzhalter" \
  DIRECT_URL="postgresql://platzhalter:platzhalter@localhost:5432/platzhalter" \
    npx prisma generate

  echo "→ Next.js bauen (ohne Migration)"
  npx next build
  exit 0
fi

echo "→ Datenbank gefunden, Prisma Client erzeugen"
npx prisma generate

echo "→ Migrationen einspielen (legt die Tabellen an)"
npx prisma migrate deploy

# Zeigt schwarz auf weiß, ob die Tabellen jetzt wirklich stehen. Schlägt das
# fehl, ist es besser, der Build wird rot, als dass die App später beim ersten
# Gast in einen Fehler läuft.
echo "→ Nachkontrolle: liegen die Tabellen in der Datenbank?"
npx prisma migrate status

echo "→ Next.js bauen"
npx next build

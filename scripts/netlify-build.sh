#!/usr/bin/env bash
# Build-Schritt für Netlify.
#
# Die Datenbank-URL kann auf zwei Wegen ankommen:
#   - selbst gesetzt:             DATABASE_URL / DIRECT_URL
#   - Netlifys Neon-Integration:  NETLIFY_DATABASE_URL / NETLIFY_DATABASE_URL_UNPOOLED
# Hier wird beides auf die Namen gebracht, die prisma/schema.prisma erwartet.
#
# Fehlt die Datenbank noch, bricht der Build NICHT ab: die Seite geht online und
# erklärt dort selbst, was noch fehlt. Das ist freundlicher als ein roter Build,
# und nach dem Verbinden reicht ein "Trigger deploy".
set -euo pipefail

export DATABASE_URL="${DATABASE_URL:-${NETLIFY_DATABASE_URL:-}}"
export DIRECT_URL="${DIRECT_URL:-${NETLIFY_DATABASE_URL_UNPOOLED:-$DATABASE_URL}}"

if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo "┌──────────────────────────────────────────────────────────────┐"
  echo "│  Noch keine Datenbank verbunden.                             │"
  echo "│                                                              │"
  echo "│  Die Seite wird trotzdem veröffentlicht und erklärt dort,     │"
  echo "│  was zu tun ist. Zum Fertigstellen:                          │"
  echo "│                                                              │"
  echo "│    1. Site configuration → Extensions → Neon installieren    │"
  echo "│    2. Deploys → Trigger deploy                               │"
  echo "│                                                              │"
  echo "│  Alternativ DATABASE_URL unter Environment variables setzen. │"
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

echo "→ Prisma Client erzeugen"
npx prisma generate

echo "→ Migrationen einspielen"
npx prisma migrate deploy

echo "→ Next.js bauen"
npx next build

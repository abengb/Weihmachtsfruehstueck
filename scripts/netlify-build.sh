#!/usr/bin/env bash
# Build-Schritt für Netlify.
#
# Die Datenbank-URL kann auf zwei Wegen ankommen:
#   - selbst gesetzt:                DATABASE_URL / DIRECT_URL
#   - Netlifys Neon-Integration:     NETLIFY_DATABASE_URL / NETLIFY_DATABASE_URL_UNPOOLED
# Hier wird beides auf die Namen gebracht, die prisma/schema.prisma erwartet.
set -euo pipefail

export DATABASE_URL="${DATABASE_URL:-${NETLIFY_DATABASE_URL:-}}"
export DIRECT_URL="${DIRECT_URL:-${NETLIFY_DATABASE_URL_UNPOOLED:-$DATABASE_URL}}"

if [ -z "$DATABASE_URL" ]; then
  echo "Fehler: Keine Datenbank konfiguriert." >&2
  echo "Setze DATABASE_URL (netlify env:set DATABASE_URL \"postgresql://…\")" >&2
  echo "oder verbinde die Neon-Integration unter Site configuration → Extensions." >&2
  exit 1
fi

echo "→ Prisma Client erzeugen"
npx prisma generate

echo "→ Migrationen einspielen"
npx prisma migrate deploy

echo "→ Next.js bauen"
npx next build

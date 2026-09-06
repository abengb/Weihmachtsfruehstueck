import { PrismaClient } from '@prisma/client'

/**
 * Netlifys Neon-Integration legt die Verbindung unter NETLIFY_DATABASE_URL ab,
 * ein selbst angelegtes Neon-Projekt üblicherweise unter DATABASE_URL.
 * Beides wird hier akzeptiert, damit beide Wege ohne Umbau funktionieren.
 */
export function datenbankUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || undefined
}

/** Ist überhaupt eine Datenbank hinterlegt? */
export function istDatenbankBereit(): boolean {
  return Boolean(datenbankUrl())
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/**
 * Genau ein Client pro Prozess. Das ist keine Feinheit, sondern Pflicht:
 * jeder PrismaClient macht einen eigenen Verbindungspool auf, und Postgres
 * lässt nur eine begrenzte Zahl davon zu. Wird hier pro Zugriff ein neuer
 * gebaut, quittiert die Datenbank nach kurzer Zeit mit
 * "sorry, too many clients already" – und zwar erst unter Last.
 */
let client: PrismaClient | undefined

/**
 * Der Client wird erst beim ersten Zugriff gebaut. Ohne diese Verzögerung
 * würde schon der Import dieser Datei krachen, solange keine Datenbank
 * verbunden ist – und dann bekäme man statt einer verständlichen Meldung
 * nur einen 500er zu sehen.
 */
function holeClient(): PrismaClient {
  if (client) return client
  // In der Entwicklung überlebt der Client den Hot Reload.
  if (globalForPrisma.prisma) return (client = globalForPrisma.prisma)

  const url = datenbankUrl()
  if (!url) {
    throw new Error(
      'Keine Datenbank verbunden. In Netlify unter Site configuration → ' +
        'Extensions die Neon-Integration installieren, oder DATABASE_URL als ' +
        'Umgebungsvariable setzen.',
    )
  }

  client = new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client
  return client
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_ziel, eigenschaft, empfaenger) {
    return Reflect.get(holeClient(), eigenschaft, empfaenger)
  },
})

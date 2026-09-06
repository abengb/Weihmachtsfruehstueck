import { PrismaClient } from '@prisma/client'

/**
 * Die Verbindung kann unter verschiedenen Namen ankommen, je nachdem wer die
 * Datenbank bereitstellt. Reihenfolge: selbst gesetzt schlägt Anbieter-Vorgabe,
 * gepoolt schlägt ungepoolt.
 */
const URL_KANDIDATEN = [
  'DATABASE_URL',
  'NETLIFY_DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'NETLIFY_DATABASE_URL_UNPOOLED',
  'DATABASE_URL_UNPOOLED',
] as const

export function datenbankUrl(): string | undefined {
  for (const name of URL_KANDIDATEN) {
    const wert = process.env[name]
    if (wert) return wert
  }
  return undefined
}

/** Ist überhaupt eine Datenbank hinterlegt? */
export function istDatenbankBereit(): boolean {
  return Boolean(datenbankUrl())
}

/**
 * Nur die Namen der gesetzten Variablen – niemals die Werte. Die Setup-Seite
 * ist öffentlich erreichbar, und in einem Verbindungs-String steht das
 * Passwort. Die Namen allein reichen, um zu erkennen, ob überhaupt etwas
 * ankommt und unter welchem Namen.
 */
export function gefundeneDatenbankVariablen(): string[] {
  return URL_KANDIDATEN.filter((name) => Boolean(process.env[name]))
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
      'Keine Datenbank verbunden. Im Netlify-Dashboard unter Project ' +
        'configuration → Data & Storage → Database eine Datenbank anlegen, ' +
        'oder DATABASE_URL als Umgebungsvariable setzen.',
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

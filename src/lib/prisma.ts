import { PrismaClient } from '@prisma/client'

/**
 * Netlifys Neon-Integration legt die Verbindung unter NETLIFY_DATABASE_URL ab,
 * ein selbst angelegtes Neon-Projekt üblicherweise unter DATABASE_URL.
 * Beides wird hier akzeptiert, damit beide Wege ohne Umbau funktionieren.
 */
export function datenbankUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || undefined
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function neuerClient() {
  const url = datenbankUrl()
  return new PrismaClient({
    ...(url ? { datasourceUrl: url } : {}),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? neuerClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

import 'server-only'
import { NextResponse } from 'next/server'
import { istDatenbankBereit } from './prisma'
import { FehlerhafteEingabe } from './validierung'

export const OHNE_DATENBANK =
  'Die App ist online, aber noch ohne Datenbank. Die Gastgeber müssen in Netlify ' +
  'einmal die Neon-Integration verbinden – danach funktioniert alles.'

export function fehler(nachricht: string, status = 400) {
  return NextResponse.json({ fehler: nachricht }, { status })
}

/** Kapselt Handler, damit jede Route dieselben Fehlerantworten liefert. */
export async function handle<T>(fn: () => Promise<T>): Promise<NextResponse> {
  if (!istDatenbankBereit()) return fehler(OHNE_DATENBANK, 503)
  try {
    return NextResponse.json(await fn())
  } catch (e) {
    if (e instanceof FehlerhafteEingabe) return fehler(e.message, e.status)
    console.error('[api]', e)
    return fehler('Da ist bei uns etwas schiefgegangen.', 500)
  }
}

export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body))
      throw new FehlerhafteEingabe('Ungültiger Anfrage-Inhalt.')
    return body as Record<string, unknown>
  } catch (e) {
    if (e instanceof FehlerhafteEingabe) throw e
    throw new FehlerhafteEingabe('Ungültiger Anfrage-Inhalt.')
  }
}

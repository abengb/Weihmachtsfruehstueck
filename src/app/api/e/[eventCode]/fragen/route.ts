import type { NextRequest } from 'next/server'
import { fehler, handle, jsonBody } from '@/lib/api'
import { frageDTO, istHost, ladeEvent } from '@/lib/eventData'
import { prisma } from '@/lib/prisma'
import { ALLE_FRAGETYPEN, alsEnum, pflichtText, pruefeOptionen } from '@/lib/validierung'

export const dynamic = 'force-dynamic'

/** Neue Gastgeber-Frage anlegen. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventCode: string }> },
) {
  const { eventCode } = await params
  const event = await ladeEvent(eventCode)
  if (!event) return fehler('Dieses Frühstück gibt es nicht.', 404)
  if (!istHost(event, request.nextUrl.searchParams.get('key')))
    return fehler('Dafür brauchst du den Gastgeber-Link.', 403)

  return handle(async () => {
    const body = await jsonBody(request)
    const frage = await prisma.question.create({
      data: {
        eventId: event.id,
        text: pflichtText(body.text, 'Fragetext', 240),
        typ: alsEnum(body.typ ?? 'SINGLE', ALLE_FRAGETYPEN, 'typ'),
        optionen: pruefeOptionen(body.optionen),
      },
    })
    return { frage: frageDTO(frage) }
  })
}

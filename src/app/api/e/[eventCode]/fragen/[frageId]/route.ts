import type { NextRequest } from 'next/server'
import { fehler, handle, jsonBody } from '@/lib/api'
import { frageDTO, istHost, ladeEvent } from '@/lib/eventData'
import { prisma } from '@/lib/prisma'
import {
  ALLE_FRAGETYPEN,
  alsBoolean,
  alsEnum,
  pflichtText,
  pruefeOptionen,
} from '@/lib/validierung'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventCode: string; frageId: string }> },
) {
  const { eventCode, frageId } = await params
  const event = await ladeEvent(eventCode)
  if (!event) return fehler('Dieses Frühstück gibt es nicht.', 404)
  if (!istHost(event, request.nextUrl.searchParams.get('key')))
    return fehler('Dafür brauchst du den Gastgeber-Link.', 403)

  const alt = event.questions.find((f) => f.id === frageId)
  if (!alt) return fehler('Diese Frage gibt es nicht.', 404)

  return handle(async () => {
    const body = await jsonBody(request)
    const optionen = body.optionen === undefined ? undefined : pruefeOptionen(body.optionen)

    const frage = await prisma.question.update({
      where: { id: frageId },
      data: {
        ...(body.text === undefined ? {} : { text: pflichtText(body.text, 'Fragetext', 240) }),
        ...(body.typ === undefined ? {} : { typ: alsEnum(body.typ, ALLE_FRAGETYPEN, 'typ') }),
        ...(optionen === undefined ? {} : { optionen }),
        ...(body.aktiv === undefined ? {} : { aktiv: alsBoolean(body.aktiv, 'aktiv') }),
      },
    })

    // Antworten auf inzwischen gestrichene Optionen aufräumen.
    if (optionen) {
      const antworten = await prisma.answer.findMany({ where: { questionId: frageId } })
      for (const a of antworten) {
        const gefiltert = a.auswahl.filter((w) => optionen.includes(w))
        if (gefiltert.length === a.auswahl.length) continue
        if (gefiltert.length === 0) await prisma.answer.delete({ where: { id: a.id } })
        else await prisma.answer.update({ where: { id: a.id }, data: { auswahl: gefiltert } })
      }
    }

    return { frage: frageDTO(frage) }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventCode: string; frageId: string }> },
) {
  const { eventCode, frageId } = await params
  const event = await ladeEvent(eventCode)
  if (!event) return fehler('Dieses Frühstück gibt es nicht.', 404)
  if (!istHost(event, request.nextUrl.searchParams.get('key')))
    return fehler('Dafür brauchst du den Gastgeber-Link.', 403)
  if (!event.questions.some((f) => f.id === frageId)) return fehler('Diese Frage gibt es nicht.', 404)

  return handle(async () => {
    await prisma.question.delete({ where: { id: frageId } })
    return { geloescht: true }
  })
}

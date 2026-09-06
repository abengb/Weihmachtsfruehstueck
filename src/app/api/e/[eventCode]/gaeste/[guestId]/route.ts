import type { NextRequest } from 'next/server'
import { fehler, handle, jsonBody } from '@/lib/api'
import { gastDTO, istHost, istOffen, ladeEvent } from '@/lib/eventData'
import { prisma } from '@/lib/prisma'
import {
  FehlerhafteEingabe,
  alsText,
  namensSchluessel,
  pflichtText,
  pruefeAntworten,
  pruefeBestellungen,
} from '@/lib/validierung'

export const dynamic = 'force-dynamic'

/**
 * Speichert alles, was ein Gast angeben kann. Jedes Feld ist optional, das
 * Ganze ist idempotent – die Gäste-Seite schickt nach jeder Änderung einfach
 * den aktuellen Stand.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventCode: string; guestId: string }> },
) {
  const { eventCode, guestId } = await params
  const event = await ladeEvent(eventCode)
  if (!event) return fehler('Dieses Frühstück gibt es nicht.', 404)

  const gast = event.guests.find((g) => g.id === guestId)
  if (!gast) return fehler('Diesen Gast kennen wir nicht.', 404)

  const alsHost = istHost(event, request.nextUrl.searchParams.get('key'))
  if (!alsHost && !istOffen(event))
    return fehler('Die Abgabe ist geschlossen. Sag den Gastgebern Bescheid.', 423)

  return handle(async () => {
    const body = await jsonBody(request)

    if (body.name !== undefined) {
      const name = pflichtText(body.name, 'Name', 60)
      const schluessel = namensSchluessel(name)
      const kollision = event.guests.find(
        (g) => g.id !== gast.id && namensSchluessel(g.name) === schluessel,
      )
      if (kollision) throw new FehlerhafteEingabe('Diesen Namen gibt es schon.', 409)
      await prisma.guest.update({ where: { id: gast.id }, data: { name } })
    }

    if (body.bestellungen !== undefined) {
      const bestellungen = pruefeBestellungen(body.bestellungen)
      // Vollständig ersetzen: die Seite schickt immer den kompletten Stand.
      await prisma.$transaction([
        prisma.eggOrder.deleteMany({ where: { guestId: gast.id } }),
        ...(bestellungen.length
          ? [prisma.eggOrder.createMany({ data: bestellungen.map((b) => ({ ...b, guestId: gast.id })) })]
          : []),
      ])
    }

    if (body.wunsch !== undefined) {
      const wunsch = alsText(body.wunsch, 'Sonderwunsch')
      await prisma.$transaction([
        prisma.wunsch.deleteMany({ where: { guestId: gast.id } }),
        ...(wunsch ? [prisma.wunsch.create({ data: { guestId: gast.id, text: wunsch } })] : []),
      ])
    }

    if (body.antworten !== undefined) {
      const antworten = pruefeAntworten(body.antworten)
      const bekannteFragen = new Map(event.questions.map((f) => [f.id, f]))

      for (const [frageId, auswahlRoh] of Object.entries(antworten)) {
        const frage = bekannteFragen.get(frageId)
        if (!frage) continue

        // Nur Optionen zulassen, die es an der Frage auch gibt.
        let auswahl = auswahlRoh.filter((a) => frage.optionen.includes(a))
        if (frage.typ === 'SINGLE') auswahl = auswahl.slice(0, 1)

        if (auswahl.length === 0) {
          await prisma.answer.deleteMany({ where: { questionId: frageId, guestId: gast.id } })
        } else {
          await prisma.answer.upsert({
            where: { questionId_guestId: { questionId: frageId, guestId: gast.id } },
            create: { questionId: frageId, guestId: gast.id, auswahl },
            update: { auswahl },
          })
        }
      }
    }

    const frisch = await prisma.guest.findUniqueOrThrow({
      where: { id: gast.id },
      include: {
        orders: { orderBy: { createdAt: 'asc' } },
        wuensche: { orderBy: { createdAt: 'asc' } },
        answers: true,
      },
    })

    return { gast: gastDTO(frisch) }
  })
}

/** Nur Gastgeber dürfen jemanden wieder austragen. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventCode: string; guestId: string }> },
) {
  const { eventCode, guestId } = await params
  const event = await ladeEvent(eventCode)
  if (!event) return fehler('Dieses Frühstück gibt es nicht.', 404)
  if (!istHost(event, request.nextUrl.searchParams.get('key')))
    return fehler('Dafür brauchst du den Gastgeber-Link.', 403)
  if (!event.guests.some((g) => g.id === guestId)) return fehler('Diesen Gast kennen wir nicht.', 404)

  return handle(async () => {
    await prisma.guest.delete({ where: { id: guestId } })
    return { geloescht: true }
  })
}

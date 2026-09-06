import type { NextRequest } from 'next/server'
import { fehler, handle, jsonBody } from '@/lib/api'
import { gastDTO, istHost, istOffen, ladeEvent } from '@/lib/eventData'
import { prisma } from '@/lib/prisma'
import { FehlerhafteEingabe, namensSchluessel, pflichtText } from '@/lib/validierung'

export const dynamic = 'force-dynamic'

/**
 * Meldet einen Gast an. Gibt es den Namen schon, kommt der bestehende Gast
 * zurück – so landet niemand versehentlich doppelt in der Liste.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventCode: string }> },
) {
  const { eventCode } = await params
  const event = await ladeEvent(eventCode)
  if (!event) return fehler('Dieses Frühstück gibt es nicht.', 404)

  const alsHost = istHost(event, request.nextUrl.searchParams.get('key'))
  if (!alsHost && !istOffen(event))
    return fehler('Die Abgabe ist geschlossen. Sag den Gastgebern Bescheid.', 423)

  return handle(async () => {
    const body = await jsonBody(request)
    const name = pflichtText(body.name, 'Name', 60)

    const schluessel = namensSchluessel(name)
    const vorhanden = event.guests.find((g) => namensSchluessel(g.name) === schluessel)
    if (vorhanden) return { gast: gastDTO(vorhanden), neu: false }

    if (event.guests.length >= 200) throw new FehlerhafteEingabe('Die Gästeliste ist voll.', 409)

    const gast = await prisma.guest.create({
      data: { eventId: event.id, name },
      include: { orders: true, wuensche: true, answers: true },
    })

    return { gast: gastDTO(gast), neu: true }
  })
}

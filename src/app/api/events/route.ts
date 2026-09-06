import { handle, jsonBody } from '@/lib/api'
import { neuerEventCode, neuerHostKey } from '@/lib/codes'
import { prisma } from '@/lib/prisma'
import { FehlerhafteEingabe, alsDatum, pflichtText } from '@/lib/validierung'

export const dynamic = 'force-dynamic'

/** Legt ein neues Event an und gibt beide Links zurück. */
export async function POST(request: Request) {
  return handle(async () => {
    const body = await jsonBody(request)
    const name = pflichtText(body.name, 'Name', 120)
    const datum = alsDatum(body.datum, 'Datum')
    const deadline = body.deadline == null ? null : alsDatum(body.deadline, 'Deadline')

    // Kollisionen sind bei 8 Zeichen unwahrscheinlich, aber nicht unmöglich.
    for (let versuch = 0; versuch < 5; versuch++) {
      const eventCode = neuerEventCode()
      const vorhanden = await prisma.event.findUnique({ where: { eventCode } })
      if (vorhanden) continue

      const event = await prisma.event.create({
        data: { name, datum, deadline, eventCode, hostKey: neuerHostKey() },
      })

      return {
        eventCode: event.eventCode,
        hostKey: event.hostKey,
        gastLink: `/e/${event.eventCode}`,
        hostLink: `/e/${event.eventCode}/host?key=${event.hostKey}`,
      }
    }

    throw new FehlerhafteEingabe('Konnte keinen freien Code finden. Bitte nochmal versuchen.', 503)
  })
}

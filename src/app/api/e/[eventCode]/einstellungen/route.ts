import type { NextRequest } from 'next/server'
import { fehler, handle, jsonBody } from '@/lib/api'
import { eventState, istHost, ladeEvent } from '@/lib/eventData'
import { prisma } from '@/lib/prisma'
import { TIMING_GRENZEN, type TimingConfig } from '@/lib/eggTiming'
import { alsBoolean, alsDatum, alsGanzzahl, alsText, pflichtText } from '@/lib/validierung'

export const dynamic = 'force-dynamic'

const TIMING_FELDER = Object.keys(TIMING_GRENZEN) as (keyof TimingConfig)[]

/** Deadline, Sperre, Bruch-Reserve und die Kochzeiten-Slider. */
export async function PATCH(
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
    const daten: Record<string, unknown> = {}

    if (body.name !== undefined) daten.name = pflichtText(body.name, 'Name', 120)
    if (body.datum !== undefined) daten.datum = alsDatum(body.datum, 'Datum')
    if (body.locked !== undefined) daten.locked = alsBoolean(body.locked, 'locked')
    if (body.bruchReserve !== undefined)
      daten.bruchReserve = alsGanzzahl(body.bruchReserve, 'Bruch-Reserve', 0, 24)

    if (body.deadline !== undefined) {
      const roh = body.deadline
      daten.deadline = roh === null || alsText(roh ?? '', 'Deadline') === '' ? null : alsDatum(roh, 'Deadline')
    }

    for (const feld of TIMING_FELDER) {
      if (body[feld] === undefined) continue
      const grenze = TIMING_GRENZEN[feld]
      daten[feld] = alsGanzzahl(body[feld], grenze.label, grenze.min, grenze.max)
    }

    if (Object.keys(daten).length > 0) {
      await prisma.event.update({ where: { id: event.id }, data: daten })
    }

    const frisch = await ladeEvent(eventCode)
    return eventState(frisch!, true)
  })
}

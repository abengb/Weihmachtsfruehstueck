import type { NextRequest } from 'next/server'
import { fehler, handle } from '@/lib/api'
import { eventState, istHost, ladeEvent } from '@/lib/eventData'

export const dynamic = 'force-dynamic'

/** Wird von Gäste- und Gastgeber-Seite alle paar Sekunden gepollt. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventCode: string }> },
) {
  const { eventCode } = await params
  const event = await ladeEvent(eventCode)
  if (!event) return fehler('Dieses Frühstück gibt es nicht.', 404)

  const alsHost = istHost(event, request.nextUrl.searchParams.get('key'))
  return handle(async () => eventState(event, alsHost))
}

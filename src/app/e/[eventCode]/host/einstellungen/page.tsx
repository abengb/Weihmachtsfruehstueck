import { notFound } from 'next/navigation'
import EinstellungenApp from '@/components/EinstellungenApp'
import { Fusszeile, Kopfzeile } from '@/components/Rahmen'
import { KeinZugang } from '@/components/KeinZugang'
import { WespenProvider } from '@/components/Wespe'
import { OhneDatenbank } from '@/components/OhneDatenbank'
import { eventState, istHost, ladeEvent } from '@/lib/eventData'
import { istDatenbankBereit } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Einstellungen · Weihnachtsfrühstück', robots: { index: false } }

export default async function EinstellungenSeite({
  params,
  searchParams,
}: PageProps<'/e/[eventCode]/host/einstellungen'>) {
  const { eventCode } = await params
  const { key } = await searchParams
  const schluessel = typeof key === 'string' ? key : null

  if (!istDatenbankBereit()) return <OhneDatenbank />


  const event = await ladeEvent(eventCode)
  if (!event) notFound()
  if (!istHost(event, schluessel)) return <KeinZugang eventCode={event.eventCode} />

  return (
    <WespenProvider>
      <Kopfzeile titel="Einstellungen" unterzeile={event.name} />
      <EinstellungenApp initial={eventState(event, true)} hostKey={event.hostKey} />
      <Fusszeile />
    </WespenProvider>
  )
}

import { notFound } from 'next/navigation'
import HostApp from '@/components/HostApp'
import { Fusszeile, Kopfzeile } from '@/components/Rahmen'
import { WespenProvider } from '@/components/Wespe'
import { OhneDatenbank } from '@/components/OhneDatenbank'
import { eventState, istHost, ladeEvent } from '@/lib/eventData'
import { istDatenbankBereit } from '@/lib/prisma'
import { KeinZugang } from '@/components/KeinZugang'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Gastgeber · Weihnachtsfrühstück', robots: { index: false } }

export default async function HostSeite({ params, searchParams }: PageProps<'/e/[eventCode]/host'>) {
  const { eventCode } = await params
  const { key } = await searchParams
  const schluessel = typeof key === 'string' ? key : null

  if (!istDatenbankBereit()) return <OhneDatenbank />


  const event = await ladeEvent(eventCode)
  if (!event) notFound()
  if (!istHost(event, schluessel)) return <KeinZugang eventCode={event.eventCode} />

  return (
    <WespenProvider>
      <Kopfzeile
        titel={event.name}
        unterzeile={`Gastgeber-Ansicht · ${event.datum.toLocaleDateString('de-DE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}`}
      />
      <HostApp initial={eventState(event, true)} hostKey={event.hostKey} />
      <Fusszeile />
    </WespenProvider>
  )
}

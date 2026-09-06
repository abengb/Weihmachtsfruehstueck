import { notFound } from 'next/navigation'
import GastApp from '@/components/GastApp'
import { Fusszeile, Kopfzeile } from '@/components/Rahmen'
import { WespenProvider } from '@/components/Wespe'
import { OhneDatenbank } from '@/components/OhneDatenbank'
import { eventState, ladeEvent } from '@/lib/eventData'
import { istDatenbankBereit } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps<'/e/[eventCode]'>) {
  const { eventCode } = await params
  if (!istDatenbankBereit()) return { title: 'Weihnachtsfrühstück' }

  const event = await ladeEvent(eventCode)
  return { title: event ? `${event.name} · Deine Wünsche` : 'Weihnachtsfrühstück' }
}

export default async function GastSeite({ params }: PageProps<'/e/[eventCode]'>) {
  const { eventCode } = await params
  if (!istDatenbankBereit()) return <OhneDatenbank />

  const event = await ladeEvent(eventCode)
  if (!event) notFound()

  const datum = event.datum.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <WespenProvider>
      <Kopfzeile titel={event.name} unterzeile={datum} />
      <GastApp initial={eventState(event, false)} />
      <Fusszeile />
    </WespenProvider>
  )
}

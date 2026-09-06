import { notFound } from 'next/navigation'
import KochplanAnsicht from '@/components/KochplanAnsicht'
import { Kopfzeile } from '@/components/Rahmen'
import { KeinZugang } from '@/components/KeinZugang'
import { OhneDatenbank } from '@/components/OhneDatenbank'
import { erstelleKochplan } from '@/lib/eggTiming'
import { istHost, ladeEvent, planEingabe, timingAusEvent } from '@/lib/eventData'
import { istDatenbankBereit } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Kochplan · Weihnachtsfrühstück', robots: { index: false } }

export default async function KochplanSeite({
  params,
  searchParams,
}: PageProps<'/e/[eventCode]/host/kochplan'>) {
  const { eventCode } = await params
  const { key } = await searchParams
  const schluessel = typeof key === 'string' ? key : null

  if (!istDatenbankBereit()) return <OhneDatenbank />


  const event = await ladeEvent(eventCode)
  if (!event) notFound()
  if (!istHost(event, schluessel)) return <KeinZugang eventCode={event.eventCode} />

  const plan = erstelleKochplan(planEingabe(event), timingAusEvent(event))

  return (
    <>
      <div className="kein-druck">
        <Kopfzeile titel="Kochplan" unterzeile={event.name} />
      </div>
      <KochplanAnsicht
        plan={plan}
        eventName={event.name}
        eventCode={event.eventCode}
        hostKey={event.hostKey}
      />
    </>
  )
}

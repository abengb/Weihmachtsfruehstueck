import NeuesEvent from '@/components/NeuesEvent'
import { OhneDatenbank } from '@/components/OhneDatenbank'
import { istDatenbankBereit } from '@/lib/prisma'
import { Fusszeile, Karte, Kopfzeile } from '@/components/Rahmen'
import { WespenProvider } from '@/components/Wespe'
import { AsternUndAdventsgesteck, KaffeetischDraussen } from '@/components/Illustrationen'
import { WespenPlatz } from '@/components/Wespe'

export default function Startseite() {
  if (!istDatenbankBereit()) return <OhneDatenbank />

  return (
    <WespenProvider>
      <Kopfzeile
        titel="Weihnachtsfrühstück"
        unterzeile="Wer will welches Ei – und wann muss es raus?"
      />

      <main className="mx-auto w-full max-w-3xl px-4 pb-12">
        <Karte className="mt-6">
          <p className="leading-relaxed text-tinte">
            Jemand hat im Spätsommer die Weihnachtskiste zu früh aufgemacht. Jetzt hängen Kugeln im
            Apfelbaum, der Kaffeetisch steht draußen, und alle wollen ihr Ei anders.
          </p>
          <p className="mt-3 leading-relaxed text-tinte-sanft">
            Diese App sammelt vorher ein, wer welches Ei möchte, beantwortet die Fragen der
            Gastgeber – und rechnet kurz vor dem Frühstück aus, wie viele Eier in den Topf kommen
            und welches wann wieder heraus muss. Ohne Anmeldung, ohne Konto.
          </p>

          <NeuesEvent />
        </Karte>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Karte>
            <h2 className="font-serif text-lg text-tanne">Für Gäste</h2>
            <p className="mt-2 text-sm leading-relaxed text-tinte-sanft">
              Link antippen, Namen eintragen, Ei aussuchen. Gespeichert wird automatisch. Beim
              nächsten Öffnen stehen deine Angaben schon da – ändern geht bis zur Deadline.
            </p>
          </Karte>
          <Karte>
            <h2 className="font-serif text-lg text-tanne">Für Gastgeber</h2>
            <p className="mt-2 text-sm leading-relaxed text-tinte-sanft">
              Eigene Fragen stellen, Antworten auswerten, Einkaufsliste ziehen – und am Morgen den
              Kochplan mit Live-Timer öffnen. Jedes Ei bekommt eine Nummer.
            </p>
          </Karte>
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-center gap-6">
          <KaffeetischDraussen className="block h-24 w-auto opacity-75" />
          <div className="relative">
            <AsternUndAdventsgesteck className="block h-24 w-auto opacity-75" />
            {/* Sitzplatz: auf einer Kerze im Adventsgesteck */}
            <WespenPlatz className="left-[85%] top-[42%]" drehung={10} />
          </div>
        </div>
      </main>

      <Fusszeile />
    </WespenProvider>
  )
}

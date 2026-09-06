import { Fusszeile, Karte, Kopfzeile } from './Rahmen'
import { WespenProvider } from './Wespe'

/**
 * Wird gezeigt, solange in Netlify noch keine Datenbank hängt. Besser als ein
 * nackter 500er: die Seite sagt, was fehlt und wo man es einschaltet.
 */
export function OhneDatenbank() {
  return (
    <WespenProvider>
      <Kopfzeile titel="Fast fertig" unterzeile="Es fehlt nur noch die Datenbank" />
      <main className="mx-auto w-full max-w-3xl px-4">
        <Karte className="mt-6">
          <p className="leading-relaxed text-tinte">
            Die App ist veröffentlicht und läuft – sie hat nur noch keinen Ort, an dem sie sich
            eure Ei-Wünsche merken kann.
          </p>

          <h2 className="mt-6 font-serif text-lg text-tanne">Für die Gastgeber: zwei Klicks</h2>
          <ol className="mt-2 space-y-2 text-sm leading-relaxed text-tinte-sanft">
            <li>
              <strong className="text-tinte">1.</strong> Im Netlify-Dashboard diese Site öffnen →{' '}
              <em>Site configuration</em> → <em>Extensions</em> → <strong>Neon</strong> installieren.
              Netlify legt die Datenbank an und trägt die Zugangsdaten selbst ein.
            </li>
            <li>
              <strong className="text-tinte">2.</strong> Danach unter <em>Deploys</em> einmal{' '}
              <em>Trigger deploy</em> → <em>Deploy site</em>.
            </li>
          </ol>

          <p className="mt-5 rounded-xl bg-nachmittag/15 px-3.5 py-3 text-sm leading-relaxed text-tinte">
            Alternativ ein kostenloses Projekt auf <strong>neon.tech</strong> anlegen und die
            gepoolte Verbindung in Netlify unter <em>Environment variables</em> als{' '}
            <code className="font-mono text-xs">DATABASE_URL</code> hinterlegen.
          </p>

          <p className="mt-5 text-sm text-tinte-sanft">
            Sobald das steht, verschwindet diese Seite von allein und das Frühstück kann geplant
            werden.
          </p>
        </Karte>
      </main>
      <Fusszeile />
    </WespenProvider>
  )
}

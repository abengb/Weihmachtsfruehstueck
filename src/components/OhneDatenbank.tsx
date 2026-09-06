import { Fusszeile, Karte, Kopfzeile } from './Rahmen'
import { WespenProvider } from './Wespe'
import { gefundeneDatenbankVariablen } from '@/lib/prisma'

/**
 * Wird gezeigt, solange keine Datenbank erreichbar ist. Besser als ein nackter
 * 500er: die Seite sagt, was fehlt, wo man es einschaltet – und zeigt, welche
 * Variablen bei ihr überhaupt ankommen, damit man den Fehler eingrenzen kann.
 */
export function OhneDatenbank() {
  const variablen = gefundeneDatenbankVariablen()

  return (
    <WespenProvider>
      <Kopfzeile titel="Fast fertig" unterzeile="Es fehlt nur noch die Datenbank" />
      <main className="mx-auto w-full max-w-3xl px-4">
        <Karte className="mt-6">
          <p className="leading-relaxed text-tinte">
            Die App ist veröffentlicht und läuft – sie hat nur noch keinen Ort, an dem sie sich
            eure Ei-Wünsche merken kann.
          </p>

          <h2 className="mt-6 font-serif text-lg text-tanne">Für die Gastgeber: zwei Schritte</h2>
          <ol className="mt-2 space-y-2 text-sm leading-relaxed text-tinte-sanft">
            <li>
              <strong className="text-tinte">1.</strong> Eine Postgres-Datenbank besorgen. Entweder
              im Netlify-Dashboard unter <em>Project configuration</em> → <em>Data &amp; Storage</em>{' '}
              → <em>Database</em> (das setzt Guthaben im Netlify-Konto voraus), oder ein
              kostenloses Projekt bei <strong>neon.tech</strong> anlegen und dessen
              Verbindungs-String in Netlify unter <em>Environment variables</em> als{' '}
              <code className="font-mono text-xs">DATABASE_URL</code> eintragen.
            </li>
            <li>
              <strong className="text-tinte">2.</strong> Danach unter <em>Deploys</em> einmal{' '}
              <em>Trigger deploy</em> → <em>Deploy site</em>. Ohne diesen zweiten Schritt bleibt
              diese Seite stehen, auch wenn die Datenbank schon existiert.
            </li>
          </ol>

          <div className="mt-6 rounded-xl border border-creme-rand bg-creme-tief px-3.5 py-3">
            <p className="text-xs font-semibold tracking-wide text-tinte-sanft uppercase">
              Selbstdiagnose
            </p>
            {variablen.length === 0 ? (
              <p className="mt-1.5 text-sm leading-relaxed text-tinte">
                Bei der App kommt <strong>keine einzige</strong> Datenbank-Variable an. Die
                Datenbank ist also entweder noch nicht angelegt, oder seit dem Anlegen wurde noch
                nicht neu deployt.
              </p>
            ) : (
              <p className="mt-1.5 text-sm leading-relaxed text-tinte">
                Diese Variablen kommen an: <strong>{variablen.join(', ')}</strong> – die App
                erkennt sie, kann die Datenbank aber trotzdem nicht erreichen. Ein Blick ins
                Build-Log unter <em>Deploys</em> zeigt, woran es hängt.
              </p>
            )}
          </div>

          <p className="mt-5 rounded-xl bg-nachmittag/15 px-3.5 py-3 text-sm leading-relaxed text-tinte">
            <strong>Falls es damit nicht klappt:</strong> ein kostenloses Projekt auf{' '}
            <strong>neon.tech</strong> anlegen und die Verbindung in Netlify unter{' '}
            <em>Environment variables</em> von Hand als{' '}
            <code className="font-mono text-xs">DATABASE_URL</code> eintragen. Dann noch einmal
            deployen.
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

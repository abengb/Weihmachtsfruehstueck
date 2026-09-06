import Link from 'next/link'
import { Fusszeile, Karte, Kopfzeile } from './Rahmen'
import { WespenProvider } from './Wespe'

export function KeinZugang({ eventCode }: { eventCode: string }) {
  return (
    <WespenProvider>
      <Kopfzeile titel="Das ist der Gastgeber-Bereich" />
      <div className="mx-auto w-full max-w-3xl px-4">
        <Karte className="mt-6">
          <p className="text-sm leading-relaxed text-tinte-sanft">
            Hierfür braucht es den geheimen Gastgeber-Link mit dem Schlüssel dahinter. Wenn du Gast
            bist, geht es{' '}
            <Link
              href={`/e/${eventCode}`}
              className="font-semibold text-tanne underline underline-offset-2"
            >
              hier zu deinen Ei-Wünschen
            </Link>
            .
          </p>
        </Karte>
      </div>
      <Fusszeile />
    </WespenProvider>
  )
}

import Link from 'next/link'
import { Fusszeile, Karte, Kopfzeile } from '@/components/Rahmen'
import { WespenProvider } from '@/components/Wespe'

export default function NichtGefunden() {
  return (
    <WespenProvider>
      <Kopfzeile titel="Diesen Link kennen wir nicht" />
      <div className="mx-auto w-full max-w-3xl px-4">
        <Karte className="mt-6">
          <p className="text-sm leading-relaxed text-tinte-sanft">
            Vielleicht hat sich beim Kopieren ein Zeichen verabschiedet. Frag am besten noch einmal
            in der WhatsApp-Gruppe nach dem Link – oder geh zurück zum{' '}
            <Link href="/" className="font-semibold text-tanne underline underline-offset-2">
              Anfang
            </Link>
            .
          </p>
        </Karte>
      </div>
      <Fusszeile />
    </WespenProvider>
  )
}

import Link from 'next/link'
import type { ReactNode } from 'react'
import { GlindeSkyline, Marmeladenglas, TannenUndApfelzweig } from './Illustrationen'
import { WespenPlatz } from './Wespe'

/**
 * Kopfzeile mit dem Zweig-Doppel und der Zeile, die das ganze Missverständnis
 * auf den Punkt bringt.
 */
export function Kopfzeile({
  titel,
  unterzeile,
  aktion,
}: {
  titel: string
  unterzeile?: string
  aktion?: ReactNode
}) {
  return (
    <header className="border-b border-creme-rand bg-tanne text-creme">
      <div className="mx-auto w-full max-w-3xl px-4 pt-5 pb-6">
        <div className="relative mb-3">
          <TannenUndApfelzweig className="h-12 w-full max-w-[240px] opacity-95" />
          {/* Sitzplatz: auf dem großen Apfel rechts im Zweig */}
          <WespenPlatz className="left-[189px] top-[54px]" drehung={-14} />
        </div>

        <p className="text-[0.72rem] font-medium tracking-[0.16em] text-nachmittag-hell uppercase">
          Glinde · Weihnachtsfrühstück im September
        </p>

        <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-[1.75rem] leading-tight text-creme">{titel}</h1>
            {unterzeile && <p className="mt-1 text-sm text-creme/80">{unterzeile}</p>}
          </div>
          {aktion}
        </div>
      </div>
    </header>
  )
}

/**
 * Fußzeile mit reduziertem Glinde-Motiv: Kupfermühle samt Mühlrad – das Rad
 * steht im Stadtwappen –, die Glinder Au, Villa Bode, Rathaus und Brunnen
 * am Marktplatz, Bürgerhaus und die Skulptur "Balance".
 */
export function Fusszeile() {
  return (
    <footer className="mt-14 border-t border-creme-rand bg-creme-tief">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="relative flex items-end justify-between gap-4">
          <GlindeSkyline className="h-16 w-full max-w-[320px] text-tanne opacity-55" />
          {/* Sitzplatz: auf dem Mühlrad */}
          <WespenPlatz className="left-[92px] top-[36px]" drehung={8} />

          <div className="relative shrink-0">
            <Marmeladenglas className="h-[72px] w-auto opacity-90" />
            {/* Sitzplatz: auf dem Rand des Marmeladenglases */}
            <WespenPlatz className="left-[6px] top-[10px]" drehung={-22} />
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-tinte-sanft">
          Glinde an der Glinder Au. Das Mühlrad der Kupfermühle steht im Stadtwappen – die Mühle
          wurde 1229 erstmals urkundlich erwähnt und ist seit 1985 Museum.
        </p>
        <p className="mt-2 text-xs text-tinte-sanft">
          <Link href="/" className="underline decoration-creme-rand underline-offset-2 hover:text-tanne">
            Weihnachtsfrühstück Schrickel
          </Link>{' '}
          · Kein Login, keine Registrierung, keine E-Mails.
        </p>
      </div>
    </footer>
  )
}

export function Karte({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
}) {
  return (
    <Tag
      className={`druck-karte rounded-karte border border-creme-rand bg-creme p-5 shadow-[0_1px_3px_rgba(43,36,28,0.06)] ${className}`}
    >
      {children}
    </Tag>
  )
}

export function Abschnittstitel({
  children,
  hinweis,
}: {
  children: ReactNode
  hinweis?: ReactNode
}) {
  return (
    <div className="mb-3">
      <h2 className="font-serif text-xl text-tanne">{children}</h2>
      {hinweis && <p className="mt-1 text-sm text-tinte-sanft">{hinweis}</p>}
    </div>
  )
}

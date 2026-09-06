'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Große, gut tippbare Auswahlkachel. */
export function Kachel({
  aktiv,
  icon,
  titel,
  hinweis,
  className = '',
  ...rest
}: {
  aktiv: boolean
  icon?: ReactNode
  titel: string
  hinweis?: string
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={aktiv}
      className={`flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-center transition ${
        aktiv
          ? 'border-tanne bg-tanne text-creme shadow-[0_2px_8px_rgba(30,77,59,0.25)]'
          : 'border-creme-rand bg-creme text-tinte hover:border-tanne-hell active:scale-[0.98]'
      } ${className}`}
      {...rest}
    >
      {icon && <span className={`block h-10 w-10 ${aktiv ? 'opacity-100' : ''}`}>{icon}</span>}
      <span className="text-sm leading-tight font-semibold">{titel}</span>
      {hinweis && (
        <span className={`text-[0.7rem] leading-tight ${aktiv ? 'text-creme/75' : 'text-tinte-sanft'}`}>
          {hinweis}
        </span>
      )}
    </button>
  )
}

/** Kleine Segment-Auswahl, z. B. für die Eigröße. */
export function Segmente<T extends string>({
  werte,
  aktiv,
  onWaehlen,
  label,
  disabled,
}: {
  werte: { wert: T; label: string }[]
  aktiv: T
  onWaehlen: (wert: T) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-tinte-sanft uppercase">
        {label}
      </span>
      <div className="flex gap-1.5" role="group" aria-label={label}>
        {werte.map((w) => (
          <button
            key={w.wert}
            type="button"
            disabled={disabled}
            aria-pressed={aktiv === w.wert}
            onClick={() => onWaehlen(w.wert)}
            className={`min-h-11 flex-1 rounded-xl border-2 px-2 text-sm font-semibold transition disabled:opacity-50 ${
              aktiv === w.wert
                ? 'border-pflaume bg-pflaume text-creme'
                : 'border-creme-rand bg-creme text-tinte hover:border-pflaume/50'
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Anzahl-Stepper mit dicken Daumen-Zielen. */
export function Stepper({
  wert,
  min,
  max,
  onAendern,
  label,
  disabled,
}: {
  wert: number
  min: number
  max: number
  onAendern: (wert: number) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-tinte-sanft uppercase">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || wert <= min}
          onClick={() => onAendern(Math.max(min, wert - 1))}
          aria-label={`${label} verringern`}
          className="h-11 w-11 shrink-0 rounded-xl border-2 border-creme-rand bg-creme text-xl leading-none font-bold text-tanne disabled:opacity-35"
        >
          −
        </button>
        <output className="min-w-10 text-center font-serif text-2xl text-tanne">{wert}</output>
        <button
          type="button"
          disabled={disabled || wert >= max}
          onClick={() => onAendern(Math.min(max, wert + 1))}
          aria-label={`${label} erhöhen`}
          className="h-11 w-11 shrink-0 rounded-xl border-2 border-creme-rand bg-creme text-xl leading-none font-bold text-tanne disabled:opacity-35"
        >
          +
        </button>
      </div>
    </div>
  )
}

/** Toggle im Stil eines Schalters. */
export function Schalter({
  an,
  onAendern,
  label,
  hinweis,
  disabled,
}: {
  an: boolean
  onAendern: (an: boolean) => void
  label: string
  hinweis?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={an}
      disabled={disabled}
      onClick={() => onAendern(!an)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-creme-rand bg-creme px-3.5 py-3 text-left transition hover:border-tanne-hell disabled:opacity-50"
    >
      <span>
        <span className="block text-sm font-semibold text-tinte">{label}</span>
        {hinweis && <span className="mt-0.5 block text-xs text-tinte-sanft">{hinweis}</span>}
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${an ? 'bg-tanne' : 'bg-creme-rand'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-creme shadow transition-all ${an ? 'left-6' : 'left-1'}`}
        />
      </span>
    </button>
  )
}

export function Knopf({
  variante = 'primaer',
  className = '',
  children,
  ...rest
}: {
  variante?: 'primaer' | 'sekundaer' | 'still' | 'gefahr'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const stile = {
    primaer: 'bg-tanne text-creme hover:bg-tanne-tief',
    sekundaer: 'border-2 border-tanne bg-creme text-tanne hover:bg-creme-tief',
    still: 'border-2 border-creme-rand bg-creme text-tinte-sanft hover:border-tanne-hell hover:text-tanne',
    gefahr: 'border-2 border-beere/40 bg-creme text-beere hover:bg-beere hover:text-creme',
  }[variante]

  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${stile} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export type SpeicherStatus = 'ruhe' | 'speichert' | 'gespeichert' | 'fehler'

/** Der kleine "Gespeichert ✓"-Hinweis, der mitläuft. */
export function SpeicherHinweis({ status, meldung }: { status: SpeicherStatus; meldung?: string }) {
  if (status === 'ruhe') return null

  const stil = {
    speichert: 'bg-creme-tief text-tinte-sanft',
    gespeichert: 'bg-apfel-hell text-tanne-tief',
    fehler: 'bg-beere text-creme',
  }[status]

  const text = {
    speichert: 'Speichert …',
    gespeichert: 'Gespeichert ✓',
    fehler: meldung ?? 'Nicht gespeichert',
  }[status]

  return (
    <span
      role="status"
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${stil} ${
        status === 'speichert' ? 'puls-sanft' : ''
      }`}
    >
      {text}
    </span>
  )
}

export function Feldbeschriftung({ children, fuer }: { children: ReactNode; fuer?: string }) {
  return (
    <label htmlFor={fuer} className="mb-1.5 block text-xs font-semibold tracking-wide text-tinte-sanft uppercase">
      {children}
    </label>
  )
}

export const eingabeStil =
  'w-full min-h-12 rounded-xl border-2 border-creme-rand bg-creme px-3.5 py-2.5 text-base text-tinte placeholder:text-tinte-sanft/60 focus:border-tanne focus:outline-none disabled:opacity-60'

'use client'

/**
 * Easter Egg: die versteckte Wespe.
 *
 * Der Spätsommer lässt grüßen. Irgendwo am Rand einer Illustration sitzt eine
 * Wespe – pro Seitenaufruf zufällig an genau einem der registrierten Plätze,
 * und dort sitzt sie dann still. Kein Tooltip, kein Hinweis im Text.
 *
 * Wer sie anklickt, verscheucht sie: kurze Flieg-weg-Animation, ein dezenter
 * Toast, danach ist sie für diese Browser-Session weg. Der Zähler
 * "wespenAbwehr" im localStorage wird nirgends angezeigt.
 *
 * Auf Kochplan- und Timer-Seite wird der Provider bewusst nicht eingebunden.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { lies, schreibe, useSeitenWurf, useSpeicher } from '@/lib/browserSpeicher'

const ZAEHLER_KEY = 'wespenAbwehr'
const SESSION_KEY = 'wespeVerscheucht'
const FLUGDAUER = 900

type WespenKontext = {
  registriere: (id: string) => () => void
  gewaehlt: string | null
  verscheuche: () => void
}

const Kontext = createContext<WespenKontext | null>(null)

export function WespenProvider({ children }: { children: ReactNode }) {
  const [plaetze, setPlaetze] = useState<string[]>([])
  const [ausgeflogen, setAusgeflogen] = useState(false)
  const [toast, setToast] = useState(false)

  // Einmal pro Seitenaufruf gewürfelt – danach sitzt sie still.
  const wurf = useSeitenWurf()

  const verscheucht = useSpeicher('session', SESSION_KEY) === '1'
  const weg = verscheucht || ausgeflogen

  const registriere = useCallback((id: string) => {
    setPlaetze((alt) => (alt.includes(id) ? alt : [...alt, id]))
    return () => setPlaetze((alt) => alt.filter((p) => p !== id))
  }, [])

  const gewaehlt = useMemo(() => {
    if (weg || plaetze.length === 0) return null
    return plaetze[Math.floor(wurf * plaetze.length) % plaetze.length]
  }, [weg, plaetze, wurf])

  const verscheuche = useCallback(() => {
    setToast(true)

    const bisher = Number(lies('local', ZAEHLER_KEY) ?? '0')
    schreibe('local', ZAEHLER_KEY, String((Number.isFinite(bisher) ? bisher : 0) + 1))

    // Erst wegfliegen lassen, dann für die Session abmelden.
    window.setTimeout(() => {
      setAusgeflogen(true)
      schreibe('session', SESSION_KEY, '1')
    }, FLUGDAUER)
    window.setTimeout(() => setToast(false), 3200)
  }, [])

  const wert = useMemo(
    () => ({ registriere, gewaehlt, verscheuche }),
    [registriere, gewaehlt, verscheuche],
  )

  return (
    <Kontext.Provider value={wert}>
      {children}
      {toast && (
        <div
          role="status"
          className="toast-rein fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-tanne-tief/95 px-5 py-2.5 text-sm font-medium text-creme shadow-lg"
        >
          Erwischt. Deckel drauf.
        </div>
      )}
    </Kontext.Provider>
  )
}

/**
 * Ein möglicher Sitzplatz. Wird um eine Illustration gelegt und positioniert
 * die Wespe über `className` – am besten in Prozent des Bildes, damit sie
 * auch bei anderer Größe noch genau dort sitzt.
 * Ohne Provider (Kochplan, Timer) rendert das hier schlicht nichts.
 */
export function WespenPlatz({ className, drehung = 0 }: { className: string; drehung?: number }) {
  const kontext = useContext(Kontext)
  const id = useId()
  const [fliegt, setFliegt] = useState(false)

  const registriere = kontext?.registriere
  useEffect(() => registriere?.(id), [registriere, id])

  if (!kontext || kontext.gewaehlt !== id) return null

  return (
    <button
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (fliegt) return
        setFliegt(true)
        kontext.verscheuche()
      }}
      className={`absolute z-10 cursor-default ${className} ${fliegt ? 'wespe-fliegt' : ''}`}
      style={{ lineHeight: 0 }}
    >
      <WespeSvg drehung={drehung} />
    </button>
  )
}

function WespeSvg({ drehung }: { drehung: number }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      style={{ transform: `rotate(${drehung}deg)` }}
      role="presentation"
      aria-hidden="true"
    >
      {/* Flügel */}
      <g fill="#dfe6ea" opacity="0.72" stroke="#b6c2c8" strokeWidth="0.5">
        <ellipse cx="9.6" cy="7.2" rx="4.6" ry="2.5" transform="rotate(-32 9.6 7.2)" />
        <ellipse cx="14" cy="7.6" rx="4" ry="2.2" transform="rotate(-14 14 7.6)" />
      </g>
      {/* Hinterleib mit Streifen */}
      <ellipse cx="13.6" cy="14.6" rx="5.4" ry="3.8" transform="rotate(24 13.6 14.6)" fill="#e8b429" />
      <g fill="#2b241c">
        <rect x="10.6" y="11.1" width="1.7" height="7.2" rx="0.6" transform="rotate(24 13.6 14.6)" />
        <rect x="13.7" y="11.2" width="1.7" height="7" rx="0.6" transform="rotate(24 13.6 14.6)" />
        <rect x="16.6" y="12.2" width="1.5" height="5" rx="0.6" transform="rotate(24 13.6 14.6)" />
      </g>
      {/* Stachel */}
      <path d="M18.4 17.4 l2.6 2.2" stroke="#2b241c" strokeWidth="1" strokeLinecap="round" />
      {/* Brust und Kopf */}
      <ellipse cx="8.6" cy="10.8" rx="3" ry="2.6" transform="rotate(24 8.6 10.8)" fill="#2b241c" />
      <circle cx="5.2" cy="9.2" r="2.2" fill="#2b241c" />
      {/* Fühler */}
      <path d="M4.2 7.4 L2.4 5.2 M6 7.2 L5.4 4.6" stroke="#2b241c" strokeWidth="0.9" strokeLinecap="round" />
      {/* Beinchen */}
      <g stroke="#2b241c" strokeWidth="0.8" strokeLinecap="round">
        <path d="M7.6 12.8 L6.4 15.4" />
        <path d="M9.8 13.2 L9.4 16" />
      </g>
    </svg>
  )
}

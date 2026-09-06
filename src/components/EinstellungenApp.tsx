'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  STANDARD_TIMING,
  TIMING_GRENZEN,
  formatMMSS,
  kochzeitSekunden,
  type EiGroesse,
  type TimingConfig,
} from '@/lib/eggTiming'
import type { EventState } from '@/lib/types'
import { Abschnittstitel, Karte } from './Rahmen'
import { Feldbeschriftung, Knopf, SpeicherHinweis, eingabeStil, type SpeicherStatus } from './ui'

const ZEIT_FELDER: (keyof TimingConfig)[] = ['zeitWeich', 'zeitWachsweich', 'zeitHart']
const ZUSCHLAG_FELDER: (keyof TimingConfig)[] = ['zuschlagKuehl', 'zuschlagS', 'zuschlagL', 'zuschlagXL']

/** datetime-local braucht Ortszeit ohne Zeitzone. */
function alsLokal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const versatz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - versatz).toISOString().slice(0, 16)
}

export default function EinstellungenApp({
  initial,
  hostKey,
}: {
  initial: EventState
  hostKey: string
}) {
  const eventCode = initial.event.eventCode
  const [state, setState] = useState(initial)
  const [status, setStatus] = useState<SpeicherStatus>('ruhe')
  const [meldung, setMeldung] = useState<string>()

  const timing = state.host?.timing ?? STANDARD_TIMING
  const [entwurf, setEntwurf] = useState<TimingConfig>(timing)
  const [name, setName] = useState(state.event.name)
  const [deadline, setDeadline] = useState(alsLokal(state.event.deadline))

  const geaendert = useMemo(
    () =>
      ZEIT_FELDER.concat(ZUSCHLAG_FELDER, ['topfKapazitaet']).some((f) => entwurf[f] !== timing[f]),
    [entwurf, timing],
  )

  async function senden(daten: Record<string, unknown>) {
    setStatus('speichert')
    try {
      const antwort = await fetch(`/api/e/${eventCode}/einstellungen?key=${encodeURIComponent(hostKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(daten),
      })
      const inhalt = await antwort.json()
      if (!antwort.ok) {
        setStatus('fehler')
        setMeldung(inhalt?.fehler ?? 'Nicht gespeichert')
        return
      }
      const frisch = inhalt as EventState
      setState(frisch)
      if (frisch.host) setEntwurf(frisch.host.timing)
      setName(frisch.event.name)
      setDeadline(alsLokal(frisch.event.deadline))
      setStatus('gespeichert')
      window.setTimeout(() => setStatus('ruhe'), 2200)
    } catch {
      setStatus('fehler')
      setMeldung('Keine Verbindung')
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12">
      <div className="mt-5 flex justify-end">
        <SpeicherHinweis status={status} meldung={meldung} />
      </div>

      {/* --- Event ------------------------------------------------------- */}
      <Karte className="mt-2">
        <Abschnittstitel>Das Frühstück</Abschnittstitel>
        <Feldbeschriftung fuer="eventname">Name</Feldbeschriftung>
        <input
          id="eventname"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          className={eingabeStil}
        />

        <div className="mt-4">
          <Feldbeschriftung fuer="deadline">
            Deadline für Änderungen (optional)
          </Feldbeschriftung>
          <input
            id="deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={eingabeStil}
          />
          <p className="mt-1.5 text-xs text-tinte-sanft">
            Danach können Gäste nichts mehr ändern. Du kannst jederzeit wieder entsperren.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Knopf
            onClick={() =>
              void senden({
                name: name.trim(),
                deadline: deadline ? new Date(deadline).toISOString() : null,
              })
            }
          >
            Speichern
          </Knopf>
          {state.event.deadline && (
            <Knopf variante="still" onClick={() => void senden({ deadline: null })}>
              Deadline entfernen
            </Knopf>
          )}
        </div>
      </Karte>

      {/* --- Kochzeiten --------------------------------------------------- */}
      <div className="mt-8">
        <Abschnittstitel hinweis="Gilt für Größe M bei Zimmertemperatur, ab dem Moment im kochenden Wasser.">
          Kochzeiten
        </Abschnittstitel>
        <Karte>
          <div className="space-y-6">
            {ZEIT_FELDER.map((feld) => (
              <Schieber
                key={feld}
                feld={feld}
                wert={entwurf[feld]}
                anzeige={formatMMSS(entwurf[feld])}
                onAendern={(wert) => setEntwurf((alt) => ({ ...alt, [feld]: wert }))}
              />
            ))}
          </div>

          <div className="mt-8 space-y-6 border-t border-creme-rand pt-6">
            <p className="text-xs font-semibold tracking-wide text-tinte-sanft uppercase">
              Zuschläge
            </p>
            {ZUSCHLAG_FELDER.map((feld) => (
              <Schieber
                key={feld}
                feld={feld}
                wert={entwurf[feld]}
                anzeige={`${entwurf[feld] < 0 ? '−' : '+'}${formatMMSS(Math.abs(entwurf[feld]))}`}
                onAendern={(wert) => setEntwurf((alt) => ({ ...alt, [feld]: wert }))}
              />
            ))}
          </div>

          <div className="mt-8 border-t border-creme-rand pt-6">
            <Schieber
              feld="topfKapazitaet"
              wert={entwurf.topfKapazitaet}
              anzeige={`${entwurf.topfKapazitaet} Eier`}
              onAendern={(wert) => setEntwurf((alt) => ({ ...alt, topfKapazitaet: wert }))}
            />
          </div>

          <Vorschau timing={entwurf} />

          <div className="mt-6 flex flex-wrap gap-2">
            <Knopf disabled={!geaendert} onClick={() => void senden({ ...entwurf })}>
              Kochzeiten speichern
            </Knopf>
            <Knopf variante="still" onClick={() => setEntwurf(timing)} disabled={!geaendert}>
              Verwerfen
            </Knopf>
            <Knopf variante="still" onClick={() => setEntwurf(STANDARD_TIMING)}>
              Auf Standard zurück
            </Knopf>
          </div>
        </Karte>
      </div>

      <div className="mt-8">
        <Link href={{ pathname: `/e/${eventCode}/host`, query: { key: hostKey } }}>
          <Knopf variante="still">← Zurück zur Übersicht</Knopf>
        </Link>
      </div>
    </div>
  )
}

function Schieber({
  feld,
  wert,
  anzeige,
  onAendern,
}: {
  feld: keyof TimingConfig
  wert: number
  anzeige: string
  onAendern: (wert: number) => void
}) {
  const grenze = TIMING_GRENZEN[feld]
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`slider-${feld}`} className="text-sm font-semibold text-tinte">
          {grenze.label}
        </label>
        <span className="font-serif text-lg text-tanne tabular-nums">{anzeige}</span>
      </div>
      <input
        id={`slider-${feld}`}
        type="range"
        min={grenze.min}
        max={grenze.max}
        step={grenze.schritt}
        value={wert}
        onChange={(e) => onAendern(Number(e.target.value))}
        className="mt-2 h-11 w-full accent-tanne"
      />
      {grenze.hinweis && <p className="text-xs text-tinte-sanft">{grenze.hinweis}</p>}
    </div>
  )
}

const VORSCHAU_GROESSEN: EiGroesse[] = ['S', 'M', 'L', 'XL']

function Vorschau({ timing }: { timing: TimingConfig }) {
  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-creme-rand">
      <table className="w-full min-w-[420px] text-sm">
        <caption className="px-3 pt-3 pb-2 text-left text-xs text-tinte-sanft">
          So lange bleiben die Eier im Topf – aus dem Kühlschrank
        </caption>
        <thead>
          <tr className="bg-creme-tief text-left">
            <th className="px-3 py-2 font-semibold">Größe</th>
            <th className="px-3 py-2 font-semibold">Weich</th>
            <th className="px-3 py-2 font-semibold">Wachsweich</th>
            <th className="px-3 py-2 font-semibold">Hart</th>
          </tr>
        </thead>
        <tbody>
          {VORSCHAU_GROESSEN.map((g) => (
            <tr key={g} className="border-t border-creme-rand">
              <td className="px-3 py-2 font-semibold text-tinte">{g}</td>
              <td className="px-3 py-2 tabular-nums">
                {formatMMSS(kochzeitSekunden('WEICH', g, 'KUEHLSCHRANK', timing))}
              </td>
              <td className="px-3 py-2 tabular-nums">
                {formatMMSS(kochzeitSekunden('WACHSWEICH', g, 'KUEHLSCHRANK', timing))}
              </td>
              <td className="px-3 py-2 tabular-nums">
                {formatMMSS(kochzeitSekunden('HART', g, 'KUEHLSCHRANK', timing))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ART_LABEL,
  erstelleEinkaufsliste,
  type GastEingabe,
} from '@/lib/eggTiming'
import { beschreibeBestellung } from '@/lib/anzeige'
import type { EventState, FrageDTO, GastDTO } from '@/lib/types'
import { Abschnittstitel, Karte } from './Rahmen'
import { Feldbeschriftung, Knopf, SpeicherHinweis, eingabeStil, type SpeicherStatus } from './ui'
import { AsternUndAdventsgesteck, IconPfanne, IconTopf, LichterketteAmZaun } from './Illustrationen'
import { WespenPlatz } from './Wespe'

const TOPF_ARTEN = ['WEICH', 'WACHSWEICH', 'HART']

export default function HostApp({ initial, hostKey }: { initial: EventState; hostKey: string }) {
  const eventCode = initial.event.eventCode
  const [state, setState] = useState(initial)
  const [status, setStatus] = useState<SpeicherStatus>('ruhe')
  const [meldung, setMeldung] = useState<string>()

  const laden = useCallback(async () => {
    try {
      const antwort = await fetch(
        `/api/e/${eventCode}/state?key=${encodeURIComponent(hostKey)}`,
        { cache: 'no-store' },
      )
      if (antwort.ok) setState(await antwort.json())
    } catch {
      /* still weiter, beim nächsten Takt wieder */
    }
  }, [eventCode, hostKey])

  // Live-Aktualisierung alle 10 Sekunden.
  useEffect(() => {
    const id = window.setInterval(() => void laden(), 10000)
    return () => window.clearInterval(id)
  }, [laden])

  const melde = useCallback((neu: SpeicherStatus, text?: string) => {
    setStatus(neu)
    setMeldung(text)
    if (neu === 'gespeichert') window.setTimeout(() => setStatus('ruhe'), 2200)
  }, [])

  const eingabe: GastEingabe[] = useMemo(
    () =>
      state.gaeste.map((g) => ({
        id: g.id,
        name: g.name,
        bestellungen: g.bestellungen,
        wuensche: g.wunsch ? [g.wunsch] : [],
      })),
    [state.gaeste],
  )

  const reserve = state.host?.bruchReserve ?? 2
  const liste = useMemo(() => erstelleEinkaufsliste(eingabe, reserve), [eingabe, reserve])

  const mitAngabe = state.gaeste.filter((g) => g.bestellungen.length > 0).length

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12">
      {/* --- Kennzahlen und Wege ---------------------------------------- */}
      <Karte className="relative mt-5 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid grid-cols-3 gap-5">
            <Kennzahl wert={state.gaeste.length} label="Zusagen" />
            <Kennzahl wert={mitAngabe} label="mit Ei-Wunsch" />
            <Kennzahl wert={liste.mitReserve} label={`Eier kaufen (+${reserve})`} />
          </div>
          <SpeicherHinweis status={status} meldung={meldung} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <TeilenKnopf eventCode={eventCode} onMelden={melde} />
          <Link href={{ pathname: `/e/${eventCode}/host/kochplan`, query: { key: hostKey } }}>
            <Knopf variante="primaer">Kochplan öffnen</Knopf>
          </Link>
          <Link href={{ pathname: `/e/${eventCode}/host/einstellungen`, query: { key: hostKey } }}>
            <Knopf variante="still">Einstellungen</Knopf>
          </Link>
        </div>

        <div className="absolute -right-3 -bottom-5 hidden opacity-60 sm:block">
          <div className="relative">
            <LichterketteAmZaun className="block w-44" />
            {/* Sitzplatz: auf der roten Lampe der Lichterkette */}
            <WespenPlatz className="left-[23%] top-[36%]" drehung={12} />
          </div>
        </div>
      </Karte>

      <ZustandsHinweis state={state} eventCode={eventCode} hostKey={hostKey} onNeu={setState} onMelden={melde} />

      {/* --- Gästeliste -------------------------------------------------- */}
      <div className="mt-8">
        <Abschnittstitel hinweis="Aktualisiert sich alle 10 Sekunden von selbst.">
          Wer kommt, wer will was
        </Abschnittstitel>
        {state.gaeste.length === 0 ? (
          <Karte>
            <p className="text-sm text-tinte-sanft">
              Noch hat sich niemand eingetragen. Teil den Gast-Link in der WhatsApp-Gruppe.
            </p>
          </Karte>
        ) : (
          <div className="space-y-3">
            {state.gaeste.map((gast) => (
              <GastZeile
                key={gast.id}
                gast={gast}
                fragen={state.fragen}
                eventCode={eventCode}
                hostKey={hostKey}
                onGeloescht={laden}
                onMelden={melde}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- Einkaufsliste ------------------------------------------------ */}
      <div className="mt-8">
        <Abschnittstitel hinweis="Ein paar Eier gehen beim Einlegen immer kaputt.">
          Einkaufsliste
        </Abschnittstitel>
        <Karte>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-serif text-4xl text-tanne">{liste.mitReserve}</p>
              <p className="mt-0.5 text-sm text-tinte-sanft">
                Eier einkaufen ({liste.gesamt} bestellt + {reserve} Bruch-Reserve)
              </p>
            </div>
            <ReserveWahl
              wert={reserve}
              eventCode={eventCode}
              hostKey={hostKey}
              onNeu={setState}
              onMelden={melde}
            />
          </div>

          {liste.nachArt.length > 0 && (
            <div className="mt-5 grid gap-2 border-t border-creme-rand pt-4 sm:grid-cols-2">
              {liste.nachArt.map((z) => (
                <div key={z.art} className="flex items-center gap-2.5 text-sm">
                  <span className="h-6 w-6 shrink-0">
                    {TOPF_ARTEN.includes(z.art) ? (
                      <IconTopf className="h-full w-full" />
                    ) : (
                      <IconPfanne className="h-full w-full" />
                    )}
                  </span>
                  <span className="font-semibold text-tinte">{z.anzahl}×</span>
                  <span className="text-tinte-sanft">{ART_LABEL[z.art]}</span>
                </div>
              ))}
            </div>
          )}

          {liste.nachGroesse.length > 0 && (
            <p className="mt-4 text-sm text-tinte-sanft">
              Nach Größe:{' '}
              {liste.nachGroesse.map((g) => `${g.anzahl}× ${g.groesse}`).join(' · ')}
            </p>
          )}
        </Karte>
      </div>

      {/* --- Fragen ------------------------------------------------------- */}
      <div className="mt-8">
        <Abschnittstitel hinweis="Jede Frage erscheint sofort bei allen Gästen.">
          Eigene Fragen
        </Abschnittstitel>
        <FragenVerwaltung
          state={state}
          eventCode={eventCode}
          hostKey={hostKey}
          onNeuLaden={laden}
          onMelden={melde}
        />
      </div>

      {/* --- Auswertung --------------------------------------------------- */}
      {state.fragen.length > 0 && (
        <div className="mt-8">
          <Abschnittstitel>Auswertung</Abschnittstitel>
          <div className="space-y-4">
            {state.fragen.map((frage) => (
              <Auswertung key={frage.id} frage={frage} gaeste={state.gaeste} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <div className="relative">
          <AsternUndAdventsgesteck className="block h-28 w-auto opacity-80" />
          {/* Sitzplatz: am Rand der Sonnenblume */}
          <WespenPlatz className="left-[8%] top-[30%]" drehung={-18} />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */

function Kennzahl({ wert, label }: { wert: number; label: string }) {
  return (
    <div>
      <p className="font-serif text-3xl leading-none text-tanne">{wert}</p>
      <p className="mt-1 text-xs leading-tight text-tinte-sanft">{label}</p>
    </div>
  )
}

function TeilenKnopf({
  eventCode,
  onMelden,
}: {
  eventCode: string
  onMelden: (status: SpeicherStatus, text?: string) => void
}) {
  const [kopiert, setKopiert] = useState(false)

  async function teilen() {
    const link = `${window.location.origin}/e/${eventCode}`
    try {
      await navigator.clipboard.writeText(link)
      setKopiert(true)
      window.setTimeout(() => setKopiert(false), 2500)
    } catch {
      // Ohne Zwischenablage-Rechte: dann eben zum Abtippen anzeigen.
      onMelden('fehler', link)
    }
  }

  return (
    <Knopf variante="sekundaer" onClick={teilen}>
      {kopiert ? 'Gast-Link kopiert ✓' : 'Gast-Link kopieren'}
    </Knopf>
  )
}

function ZustandsHinweis({
  state,
  eventCode,
  hostKey,
  onNeu,
  onMelden,
}: {
  state: EventState
  eventCode: string
  hostKey: string
  onNeu: (state: EventState) => void
  onMelden: (status: SpeicherStatus, text?: string) => void
}) {
  const offen = state.event.offen

  async function umschalten() {
    onMelden('speichert')
    try {
      const antwort = await fetch(`/api/e/${eventCode}/einstellungen?key=${encodeURIComponent(hostKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          // Entsperren heißt: Sperre weg und eine abgelaufene Deadline aufheben.
          offen ? { locked: true } : { locked: false, deadline: null },
        ),
      })
      const inhalt = await antwort.json()
      if (!antwort.ok) return onMelden('fehler', inhalt?.fehler)
      onNeu(inhalt)
      onMelden('gespeichert')
    } catch {
      onMelden('fehler', 'Keine Verbindung')
    }
  }

  const deadline = state.event.deadline ? new Date(state.event.deadline) : null

  return (
    <Karte className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-tinte">
            {offen ? 'Gäste können ihre Angaben ändern' : 'Abgabe ist geschlossen'}
          </p>
          <p className="mt-0.5 text-xs text-tinte-sanft">
            {deadline
              ? `Deadline: ${deadline.toLocaleString('de-DE', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })} Uhr`
              : 'Keine Deadline gesetzt'}
            {state.event.locked ? ' · manuell gesperrt' : ''}
          </p>
        </div>
        <Knopf variante={offen ? 'gefahr' : 'primaer'} onClick={umschalten}>
          {offen ? 'Jetzt sperren' : 'Wieder entsperren'}
        </Knopf>
      </div>
    </Karte>
  )
}

function ReserveWahl({
  wert,
  eventCode,
  hostKey,
  onNeu,
  onMelden,
}: {
  wert: number
  eventCode: string
  hostKey: string
  onNeu: (state: EventState) => void
  onMelden: (status: SpeicherStatus, text?: string) => void
}) {
  async function setzen(neu: number) {
    onMelden('speichert')
    try {
      const antwort = await fetch(`/api/e/${eventCode}/einstellungen?key=${encodeURIComponent(hostKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bruchReserve: neu }),
      })
      const inhalt = await antwort.json()
      if (!antwort.ok) return onMelden('fehler', inhalt?.fehler)
      onNeu(inhalt)
      onMelden('gespeichert')
    } catch {
      onMelden('fehler', 'Keine Verbindung')
    }
  }

  return (
    <div>
      <Feldbeschriftung>Bruch-Reserve</Feldbeschriftung>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setzen(Math.max(0, wert - 1))}
          aria-label="Reserve verringern"
          className="h-11 w-11 rounded-xl border-2 border-creme-rand bg-creme text-xl font-bold text-tanne"
        >
          −
        </button>
        <output className="min-w-8 text-center font-serif text-2xl text-tanne">+{wert}</output>
        <button
          type="button"
          onClick={() => setzen(Math.min(24, wert + 1))}
          aria-label="Reserve erhöhen"
          className="h-11 w-11 rounded-xl border-2 border-creme-rand bg-creme text-xl font-bold text-tanne"
        >
          +
        </button>
      </div>
    </div>
  )
}

function GastZeile({
  gast,
  fragen,
  eventCode,
  hostKey,
  onGeloescht,
  onMelden,
}: {
  gast: GastDTO
  fragen: FrageDTO[]
  eventCode: string
  hostKey: string
  onGeloescht: () => void
  onMelden: (status: SpeicherStatus, text?: string) => void
}) {
  const [fragtNach, setFragtNach] = useState(false)

  async function loeschen() {
    onMelden('speichert')
    try {
      const antwort = await fetch(
        `/api/e/${eventCode}/gaeste/${gast.id}?key=${encodeURIComponent(hostKey)}`,
        { method: 'DELETE' },
      )
      if (!antwort.ok) {
        const inhalt = await antwort.json().catch(() => null)
        return onMelden('fehler', inhalt?.fehler)
      }
      onMelden('gespeichert')
      onGeloescht()
    } catch {
      onMelden('fehler', 'Keine Verbindung')
    }
  }

  const offeneFragen = fragen.filter((f) => f.aktiv && (gast.antworten[f.id] ?? []).length === 0)

  return (
    <Karte>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-serif text-lg text-tanne">{gast.name}</h3>
        {fragtNach ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-tinte-sanft">Wirklich austragen?</span>
            <Knopf variante="gefahr" className="min-h-9 px-3 text-xs" onClick={loeschen}>
              Ja
            </Knopf>
            <Knopf variante="still" className="min-h-9 px-3 text-xs" onClick={() => setFragtNach(false)}>
              Nein
            </Knopf>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFragtNach(true)}
            className="min-h-9 rounded-lg px-2 text-xs font-semibold text-tinte-sanft hover:text-beere"
          >
            Austragen
          </button>
        )}
      </div>

      <p className="mt-2 text-sm text-tinte">
        {gast.bestellungen.length === 0 ? (
          <span className="text-tinte-sanft">Noch keine Ei-Angabe</span>
        ) : (
          gast.bestellungen
            .map((b) => `${beschreibeBestellung(b)}${b.notiz ? ` – ${b.notiz}` : ''}`)
            .join(' · ')
        )}
      </p>

      {gast.wunsch && (
        <p className="mt-2 rounded-xl bg-nachmittag/12 px-3 py-2 text-sm whitespace-pre-line text-tinte">
          {gast.wunsch}
        </p>
      )}

      {fragen.length > 0 && (
        <p className="mt-2 text-xs text-tinte-sanft">
          {offeneFragen.length === 0
            ? 'Alle Fragen beantwortet ✓'
            : `Offen: ${offeneFragen.map((f) => f.text).join(', ')}`}
        </p>
      )}
    </Karte>
  )
}

function FragenVerwaltung({
  state,
  eventCode,
  hostKey,
  onNeuLaden,
  onMelden,
}: {
  state: EventState
  eventCode: string
  hostKey: string
  onNeuLaden: () => void
  onMelden: (status: SpeicherStatus, text?: string) => void
}) {
  const [bearbeitet, setBearbeitet] = useState<string | 'neu' | null>(null)

  async function senden(pfad: string, methode: string, body?: unknown) {
    onMelden('speichert')
    try {
      const antwort = await fetch(`${pfad}${pfad.includes('?') ? '&' : '?'}key=${encodeURIComponent(hostKey)}`, {
        method: methode,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const inhalt = await antwort.json().catch(() => null)
      if (!antwort.ok) {
        onMelden('fehler', inhalt?.fehler ?? 'Das hat nicht geklappt')
        return false
      }
      onMelden('gespeichert')
      onNeuLaden()
      return true
    } catch {
      onMelden('fehler', 'Keine Verbindung')
      return false
    }
  }

  return (
    <div className="space-y-3">
      {state.fragen.map((frage) =>
        bearbeitet === frage.id ? (
          <FrageFormular
            key={frage.id}
            frage={frage}
            onAbbrechen={() => setBearbeitet(null)}
            onSpeichern={async (daten) => {
              if (await senden(`/api/e/${eventCode}/fragen/${frage.id}`, 'PATCH', daten))
                setBearbeitet(null)
            }}
          />
        ) : (
          <Karte key={frage.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className={`font-serif text-lg ${frage.aktiv ? 'text-tanne' : 'text-tinte-sanft'}`}>
                  {frage.text}
                </h3>
                <p className="mt-1 text-sm text-tinte-sanft">
                  {frage.typ === 'MULTI' ? 'Mehrfachauswahl' : 'Eine Antwort'} ·{' '}
                  {frage.optionen.join(' · ')}
                </p>
                {!frage.aktiv && (
                  <p className="mt-1 text-xs font-semibold text-beere">
                    Inaktiv – Gäste sehen die Frage nicht
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Knopf
                  variante="still"
                  className="min-h-9 px-3 text-xs"
                  onClick={() => void senden(`/api/e/${eventCode}/fragen/${frage.id}`, 'PATCH', { aktiv: !frage.aktiv })}
                >
                  {frage.aktiv ? 'Ausblenden' : 'Einblenden'}
                </Knopf>
                <Knopf variante="still" className="min-h-9 px-3 text-xs" onClick={() => setBearbeitet(frage.id)}>
                  Bearbeiten
                </Knopf>
                <Knopf
                  variante="gefahr"
                  className="min-h-9 px-3 text-xs"
                  onClick={() => void senden(`/api/e/${eventCode}/fragen/${frage.id}`, 'DELETE')}
                >
                  Löschen
                </Knopf>
              </div>
            </div>
          </Karte>
        ),
      )}

      {bearbeitet === 'neu' ? (
        <FrageFormular
          onAbbrechen={() => setBearbeitet(null)}
          onSpeichern={async (daten) => {
            if (await senden(`/api/e/${eventCode}/fragen`, 'POST', daten)) setBearbeitet(null)
          }}
        />
      ) : (
        <Knopf variante="sekundaer" className="w-full" onClick={() => setBearbeitet('neu')}>
          + Frage hinzufügen
        </Knopf>
      )}
    </div>
  )
}

function FrageFormular({
  frage,
  onSpeichern,
  onAbbrechen,
}: {
  frage?: FrageDTO
  onSpeichern: (daten: { text: string; typ: string; optionen: string[] }) => void
  onAbbrechen: () => void
}) {
  const [text, setText] = useState(frage?.text ?? '')
  const [typ, setTyp] = useState(frage?.typ ?? 'SINGLE')
  const [optionen, setOptionen] = useState<string[]>(frage?.optionen ?? ['', ''])

  const gueltig = text.trim().length > 0 && optionen.filter((o) => o.trim()).length >= 2

  return (
    <Karte className="border-tanne">
      <Feldbeschriftung fuer="fragetext">Frage</Feldbeschriftung>
      <input
        id="fragetext"
        value={text}
        maxLength={240}
        onChange={(e) => setText(e.target.value)}
        placeholder="Wer bringt was mit?"
        className={eingabeStil}
      />

      <div className="mt-4">
        <Feldbeschriftung>Antwortart</Feldbeschriftung>
        <div className="flex gap-2">
          {(['SINGLE', 'MULTI'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={typ === t}
              onClick={() => setTyp(t)}
              className={`min-h-11 flex-1 rounded-xl border-2 text-sm font-semibold transition ${
                typ === t ? 'border-pflaume bg-pflaume text-creme' : 'border-creme-rand bg-creme text-tinte'
              }`}
            >
              {t === 'SINGLE' ? 'Eine Antwort' : 'Mehrfachauswahl'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Feldbeschriftung>Antwortoptionen</Feldbeschriftung>
        <div className="space-y-2">
          {optionen.map((option, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={option}
                maxLength={120}
                onChange={(e) =>
                  setOptionen((alt) => alt.map((o, k) => (k === i ? e.target.value : o)))
                }
                placeholder={`Option ${i + 1}`}
                className={eingabeStil}
              />
              {optionen.length > 2 && (
                <button
                  type="button"
                  aria-label={`Option ${i + 1} entfernen`}
                  onClick={() => setOptionen((alt) => alt.filter((_, k) => k !== i))}
                  className="h-12 w-12 shrink-0 rounded-xl border-2 border-creme-rand text-beere"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {optionen.length < 12 && (
          <Knopf
            variante="still"
            className="mt-2 w-full"
            onClick={() => setOptionen((alt) => [...alt, ''])}
          >
            + Option
          </Knopf>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <Knopf
          disabled={!gueltig}
          onClick={() =>
            onSpeichern({ text: text.trim(), typ, optionen: optionen.map((o) => o.trim()).filter(Boolean) })
          }
        >
          {frage ? 'Änderungen speichern' : 'Frage anlegen'}
        </Knopf>
        <Knopf variante="still" onClick={onAbbrechen}>
          Abbrechen
        </Knopf>
      </div>
    </Karte>
  )
}

function Auswertung({ frage, gaeste }: { frage: FrageDTO; gaeste: GastDTO[] }) {
  const proOption = frage.optionen.map((option) => ({
    option,
    namen: gaeste.filter((g) => (g.antworten[frage.id] ?? []).includes(option)).map((g) => g.name),
  }))
  const ohneAntwort = gaeste.filter((g) => (g.antworten[frage.id] ?? []).length === 0)
  const beteiligt = gaeste.length - ohneAntwort.length

  return (
    <Karte>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-lg text-tanne">{frage.text}</h3>
        <span className="text-xs text-tinte-sanft">
          {beteiligt} von {gaeste.length} geantwortet
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {proOption.map(({ option, namen }) => {
          const prozent = beteiligt === 0 ? 0 : Math.round((namen.length / beteiligt) * 100)
          return (
            <div key={option}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold text-tinte">{option}</span>
                <span className="shrink-0 text-tinte-sanft">
                  {namen.length} · {prozent}%
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-creme-tief">
                <div
                  className="h-full rounded-full bg-tanne transition-all"
                  style={{ width: `${prozent}%` }}
                />
              </div>
              {namen.length > 0 && <p className="mt-1 text-xs text-tinte-sanft">{namen.join(' · ')}</p>}
            </div>
          )
        })}
      </div>

      {ohneAntwort.length > 0 && (
        <p className="mt-4 border-t border-creme-rand pt-3 text-xs text-tinte-sanft">
          <span className="font-semibold text-beere">Hat noch nicht geantwortet:</span>{' '}
          {ohneAntwort.map((g) => g.name).join(' · ')}
        </p>
      )}
    </Karte>
  )
}

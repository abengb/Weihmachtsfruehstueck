'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Karte } from './Rahmen'
import { Feldbeschriftung, Knopf, SpeicherHinweis, eingabeStil, type SpeicherStatus } from './ui'

type Ergebnis = { eventCode: string; hostKey: string; gastLink: string; hostLink: string }

export default function NeuesEvent() {
  const [offen, setOffen] = useState(false)
  const [name, setName] = useState('Weihnachtsfrühstück Schrickel')
  const [datum, setDatum] = useState('')
  const [status, setStatus] = useState<SpeicherStatus>('ruhe')
  const [meldung, setMeldung] = useState<string>()
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null)

  async function anlegen() {
    setStatus('speichert')
    try {
      const antwort = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          datum: datum ? new Date(datum).toISOString() : new Date().toISOString(),
        }),
      })
      const inhalt = await antwort.json()
      if (!antwort.ok) {
        setStatus('fehler')
        setMeldung(inhalt?.fehler ?? 'Das hat nicht geklappt')
        return
      }
      setErgebnis(inhalt)
      setStatus('ruhe')
    } catch {
      setStatus('fehler')
      setMeldung('Keine Verbindung')
    }
  }

  if (ergebnis) {
    return (
      <Karte className="mt-6">
        <h2 className="font-serif text-xl text-tanne">Angelegt. Zwei Links, gut aufheben.</h2>
        <LinkZeile
          titel="Für alle Gäste (WhatsApp-Gruppe)"
          pfad={ergebnis.gastLink}
          betont
        />
        <LinkZeile
          titel="Nur für euch als Gastgeber – bitte nicht weitergeben"
          pfad={ergebnis.hostLink}
        />
        <div className="mt-5">
          <Link href={ergebnis.hostLink}>
            <Knopf>Zur Gastgeber-Ansicht</Knopf>
          </Link>
        </div>
      </Karte>
    )
  }

  if (!offen) {
    return (
      <div className="mt-6">
        <Knopf variante="sekundaer" onClick={() => setOffen(true)}>
          Neues Frühstück anlegen
        </Knopf>
      </div>
    )
  }

  return (
    <Karte className="mt-6">
      <h2 className="font-serif text-xl text-tanne">Neues Frühstück</h2>

      <div className="mt-4">
        <Feldbeschriftung fuer="neu-name">Name</Feldbeschriftung>
        <input
          id="neu-name"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          className={eingabeStil}
        />
      </div>

      <div className="mt-4">
        <Feldbeschriftung fuer="neu-datum">Wann?</Feldbeschriftung>
        <input
          id="neu-datum"
          type="datetime-local"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          className={eingabeStil}
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Knopf disabled={!name.trim()} onClick={anlegen}>
          Anlegen
        </Knopf>
        <Knopf variante="still" onClick={() => setOffen(false)}>
          Abbrechen
        </Knopf>
        <SpeicherHinweis status={status} meldung={meldung} />
      </div>
    </Karte>
  )
}

function LinkZeile({ titel, pfad, betont }: { titel: string; pfad: string; betont?: boolean }) {
  const [kopiert, setKopiert] = useState(false)

  return (
    <div className={`mt-4 rounded-xl border-2 p-3 ${betont ? 'border-tanne' : 'border-creme-rand'}`}>
      <p className="text-xs font-semibold tracking-wide text-tinte-sanft uppercase">{titel}</p>
      <p className="mt-1.5 font-mono text-xs break-all text-tinte">{pfad}</p>
      <Knopf
        variante="still"
        className="mt-2 min-h-9 px-3 text-xs"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${window.location.origin}${pfad}`)
            setKopiert(true)
            window.setTimeout(() => setKopiert(false), 2500)
          } catch {
            /* dann eben von Hand markieren */
          }
        }}
      >
        {kopiert ? 'Kopiert ✓' : 'Link kopieren'}
      </Knopf>
    </div>
  )
}

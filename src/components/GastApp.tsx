'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { EiArt, EiGroesse } from '@/lib/eggTiming'
import { ART_LABEL } from '@/lib/eggTiming'
import { beschreibeBestellung } from '@/lib/anzeige'
import { schreibe, useIstBrowser, useSpeicher } from '@/lib/browserSpeicher'
import type { BestellungDTO, EventState, FrageDTO, GastDTO } from '@/lib/types'
import { Karte, Abschnittstitel } from './Rahmen'
import {
  Feldbeschriftung,
  Kachel,
  Knopf,
  Schalter,
  Segmente,
  SpeicherHinweis,
  Stepper,
  eingabeStil,
  type SpeicherStatus,
} from './ui'
import {
  IconHart,
  IconKeinEi,
  IconPochiert,
  IconRuehrei,
  IconSpiegelei,
  IconWachsweich,
  IconWeich,
  KaffeetischDraussen,
  KugelImGartenbaum,
} from './Illustrationen'
import { WespenPlatz } from './Wespe'

type Zeile = Omit<BestellungDTO, 'id'>

const EI_KACHELN: { art: EiArt; icon: ReactNode; hinweis?: string }[] = [
  { art: 'KEINS', icon: <IconKeinEi className="h-full w-full" /> },
  { art: 'WEICH', icon: <IconWeich className="h-full w-full" />, hinweis: 'Dotter läuft' },
  { art: 'WACHSWEICH', icon: <IconWachsweich className="h-full w-full" />, hinweis: 'Kern noch weich' },
  { art: 'HART', icon: <IconHart className="h-full w-full" />, hinweis: 'Durch und durch' },
  { art: 'RUEHREI', icon: <IconRuehrei className="h-full w-full" />, hinweis: 'Aus der Pfanne' },
  { art: 'SPIEGELEI', icon: <IconSpiegelei className="h-full w-full" />, hinweis: 'Aus der Pfanne' },
  { art: 'POCHIERT', icon: <IconPochiert className="h-full w-full" />, hinweis: 'Ohne Schale' },
]

const GROESSEN: { wert: EiGroesse; label: string }[] = [
  { wert: 'S', label: 'S' },
  { wert: 'M', label: 'M' },
  { wert: 'L', label: 'L' },
  { wert: 'XL', label: 'XL' },
]

const TOPF_ARTEN: EiArt[] = ['WEICH', 'WACHSWEICH', 'HART']

function neueZeile(art: EiArt = 'WEICH'): Zeile {
  return { art, anzahl: 1, groesse: 'M', temperatur: 'KUEHLSCHRANK', notiz: null }
}

function speicherSchluessel(eventCode: string) {
  return `wf:gast:${eventCode}`
}

/**
 * Hält den Event-Zustand und weiß, wer gerade am Handy sitzt. Die Eingaben
 * selbst liegen in <GastFormular>, das über den Gast-Schlüssel frisch
 * aufgebaut wird, sobald jemand wechselt.
 */
export default function GastApp({ initial }: { initial: EventState }) {
  const eventCode = initial.event.eventCode
  const schluessel = speicherSchluessel(eventCode)

  const [state, setState] = useState(initial)
  const [status, setStatus] = useState<SpeicherStatus>('ruhe')
  const [meldung, setMeldung] = useState<string>()

  const istBrowser = useIstBrowser()
  const gastId = useSpeicher('local', schluessel)
  const gast = useMemo(
    () => state.gaeste.find((g) => g.id === gastId) ?? null,
    [state.gaeste, gastId],
  )

  // Neue Fragen und der Stand der Deadline kommen per Polling nach.
  useEffect(() => {
    const id = window.setInterval(async () => {
      try {
        const antwort = await fetch(`/api/e/${eventCode}/state`, { cache: 'no-store' })
        if (antwort.ok) setState(await antwort.json())
      } catch {
        /* Funkloch am Frühstückstisch – beim nächsten Mal wieder */
      }
    }, 15000)
    return () => window.clearInterval(id)
  }, [eventCode])

  const uebernimmGast = useCallback((neu: GastDTO) => {
    setState((alt) => ({
      ...alt,
      gaeste: alt.gaeste.some((g) => g.id === neu.id)
        ? alt.gaeste.map((g) => (g.id === neu.id ? neu : g))
        : [...alt.gaeste, neu],
    }))
  }, [])

  async function anmelden(name: string) {
    setStatus('speichert')
    try {
      const antwort = await fetch(`/api/e/${eventCode}/gaeste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const inhalt = await antwort.json()
      if (!antwort.ok) {
        setStatus('fehler')
        setMeldung(inhalt?.fehler ?? 'Das hat nicht geklappt')
        return
      }
      const neu = inhalt.gast as GastDTO
      uebernimmGast(neu)
      schreibe('local', schluessel, neu.id)
      setStatus('ruhe')
    } catch {
      setStatus('fehler')
      setMeldung('Keine Verbindung')
    }
  }

  if (!istBrowser) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 text-center text-tinte-sanft">
        Einen Moment …
      </div>
    )
  }

  if (!gast) {
    return (
      <NamensAnmeldung
        namen={state.gaeste.map((g) => g.name)}
        offen={state.event.offen}
        status={status}
        meldung={meldung}
        onAnmelden={anmelden}
        event={state.event}
      />
    )
  }

  return (
    <GastFormular
      key={gast.id}
      gast={gast}
      fragen={state.fragen}
      offen={state.event.offen}
      eventCode={eventCode}
      onGespeichert={uebernimmGast}
      onWechseln={() => schreibe('local', schluessel, null)}
    />
  )
}

/* ------------------------------------------------------------------------ */

function GastFormular({
  gast,
  fragen,
  offen,
  eventCode,
  onGespeichert,
  onWechseln,
}: {
  gast: GastDTO
  fragen: FrageDTO[]
  offen: boolean
  eventCode: string
  onGespeichert: (gast: GastDTO) => void
  onWechseln: () => void
}) {
  const [zeilen, setZeilen] = useState<Zeile[]>(() =>
    gast.bestellungen.length
      ? gast.bestellungen.map(({ art, anzahl, groesse, temperatur, notiz }) => ({
          art,
          anzahl,
          groesse,
          temperatur,
          notiz,
        }))
      : [neueZeile()],
  )
  const [wunsch, setWunsch] = useState(gast.wunsch)
  const [antworten, setAntworten] = useState<Record<string, string[]>>(gast.antworten)

  const [status, setStatus] = useState<SpeicherStatus>('ruhe')
  const [meldung, setMeldung] = useState<string>()

  const schmutzig = useRef(false)

  const speichern = useCallback(
    async (daten: {
      bestellungen: Zeile[]
      wunsch: string
      antworten: Record<string, string[]>
    }) => {
      setStatus('speichert')
      try {
        const antwort = await fetch(`/api/e/${eventCode}/gaeste/${gast.id}`, {
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
        onGespeichert(inhalt.gast as GastDTO)
        setStatus('gespeichert')
        window.setTimeout(() => setStatus((s) => (s === 'gespeichert' ? 'ruhe' : s)), 2200)
      } catch {
        setStatus('fehler')
        setMeldung('Keine Verbindung')
      }
    },
    [eventCode, gast.id, onGespeichert],
  )

  // Gebündeltes Speichern, kurz nachdem die Finger stillhalten.
  useEffect(() => {
    if (!schmutzig.current || !offen) return
    const timer = window.setTimeout(() => {
      schmutzig.current = false
      void speichern({ bestellungen: zeilen, wunsch, antworten })
    }, 700)
    return () => window.clearTimeout(timer)
  }, [zeilen, wunsch, antworten, offen, speichern])

  function markiere() {
    schmutzig.current = true
  }

  const nurKeinEi = zeilen.length === 1 && zeilen[0].art === 'KEINS'

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12">
      {!offen && (
        <div className="mt-5 rounded-karte border-2 border-beere/30 bg-beere/8 p-4">
          <p className="font-serif text-lg text-beere">Die Abgabe ist geschlossen</p>
          <p className="mt-1 text-sm text-tinte-sanft">
            Deine Angaben stehen weiter unten – ändern lässt sich gerade nichts mehr. Wenn du doch
            noch etwas brauchst: kurz bei den Gastgebern melden.
          </p>
        </div>
      )}

      {/* --- Übersicht ganz oben --------------------------------------- */}
      <Karte className="mt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-tinte-sanft uppercase">
              Deine Angaben
            </p>
            <h2 className="mt-0.5 font-serif text-2xl text-tanne">{gast.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <SpeicherHinweis status={status} meldung={meldung} />
            <Knopf variante="still" onClick={onWechseln} className="text-xs">
              Ich bin nicht {gast.name.split(' ')[0]}?
            </Knopf>
          </div>
        </div>

        <Zusammenfassung zeilen={zeilen} wunsch={wunsch} antworten={antworten} fragen={fragen} />
      </Karte>

      {/* --- Ei-Abfrage ------------------------------------------------ */}
      <div className="mt-6">
        <Abschnittstitel hinweis="Du darfst auch mischen – ein weiches und ein Rührei zum Beispiel.">
          Welches Ei darf es sein?
        </Abschnittstitel>

        <div className="space-y-4">
          {zeilen.map((zeile, i) => (
            <EiZeile
              key={i}
              zeile={zeile}
              index={i}
              gesamt={zeilen.length}
              disabled={!offen}
              onAendern={(neu) => {
                markiere()
                setZeilen((alt) => {
                  // "Kein Ei" verträgt sich mit nichts anderem.
                  if (neu.art === 'KEINS') return [neueZeile('KEINS')]
                  const kopie = [...alt]
                  kopie[i] = neu
                  return kopie
                })
              }}
              onEntfernen={() => {
                markiere()
                setZeilen((alt) => (alt.length > 1 ? alt.filter((_, k) => k !== i) : alt))
              }}
            />
          ))}
        </div>

        {!nurKeinEi && zeilen.length < 8 && (
          <Knopf
            variante="sekundaer"
            disabled={!offen}
            className="mt-4 w-full"
            onClick={() => {
              markiere()
              setZeilen((alt) => [...alt, neueZeile()])
            }}
          >
            + Noch ein Ei hinzufügen
          </Knopf>
        )}
      </div>

      {/* --- Sonderwünsche --------------------------------------------- */}
      <Karte className="relative mt-6">
        <Abschnittstitel hinweis="Allergien, Unverträglichkeiten – oder was du mitbringst.">
          Sonderwünsche
        </Abschnittstitel>
        <textarea
          id="wunsch"
          rows={3}
          disabled={!offen}
          value={wunsch}
          maxLength={500}
          placeholder="Zum Beispiel: Nussallergie. Und ich bringe Lachs mit."
          onChange={(e) => {
            markiere()
            setWunsch(e.target.value)
          }}
          className={`${eingabeStil} resize-y`}
        />
        <div className="absolute -top-1 right-3 hidden opacity-90 sm:block">
          <div className="relative">
            <KugelImGartenbaum className="block h-24 w-auto" />
            {/* Sitzplatz: auf der Weihnachtskugel */}
            <WespenPlatz className="left-[24%] top-[42%]" drehung={16} />
          </div>
        </div>
      </Karte>

      {/* --- Fragen der Gastgeber -------------------------------------- */}
      {fragen.length > 0 && (
        <div className="mt-8">
          <Abschnittstitel hinweis="Ein Klick genügt, gespeichert wird von allein.">
            Fragen der Gastgeber
          </Abschnittstitel>
          <div className="space-y-4">
            {fragen.map((frage) => (
              <FrageKarte
                key={frage.id}
                frage={frage}
                auswahl={antworten[frage.id] ?? []}
                disabled={!offen}
                onAendern={(neu) => {
                  markiere()
                  setAntworten((alt) => ({ ...alt, [frage.id]: neu }))
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <div className="relative">
          <KaffeetischDraussen className="block h-28 w-auto opacity-80" />
          {/* Sitzplatz: auf dem Eierbecher */}
          <WespenPlatz className="left-[79%] top-[21%]" drehung={-8} />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ */

function NamensAnmeldung({
  namen,
  offen,
  status,
  meldung,
  onAnmelden,
  event,
}: {
  namen: string[]
  offen: boolean
  status: SpeicherStatus
  meldung?: string
  onAnmelden: (name: string) => void
  event: EventState['event']
}) {
  const [name, setName] = useState('')
  const treffer = useMemo(() => {
    const suche = name.trim().toLocaleLowerCase('de')
    if (!suche) return []
    return namen.filter((n) => n.toLocaleLowerCase('de').includes(suche)).slice(0, 5)
  }, [name, namen])

  const datum = new Date(event.datum)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12">
      <Karte className="mt-6">
        <p className="text-sm text-tinte-sanft">
          {datum.toLocaleDateString('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <h2 className="mt-1 font-serif text-2xl text-tanne">Schön, dass du kommst.</h2>
        <p className="mt-2 text-sm leading-relaxed text-tinte-sanft">
          Sag uns nur deinen Namen, dann kannst du dein Ei aussuchen. Kein Konto, kein Passwort,
          nichts zum Merken.
        </p>

        {!offen && (
          <p className="mt-4 rounded-xl border-2 border-beere/30 bg-beere/8 p-3 text-sm text-beere">
            Die Abgabe ist bereits geschlossen. Melde dich direkt bei den Gastgebern.
          </p>
        )}

        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) onAnmelden(name.trim())
          }}
        >
          <Feldbeschriftung fuer="name">Dein Name</Feldbeschriftung>
          <input
            id="name"
            name="name"
            autoComplete="off"
            list="bekannte-namen"
            disabled={!offen}
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anna"
            className={eingabeStil}
          />
          <datalist id="bekannte-namen">
            {namen.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>

          {treffer.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs text-tinte-sanft">
                Schon eingetragen – tipp drauf, dann öffnest du deine eigenen Angaben:
              </p>
              <div className="flex flex-wrap gap-2">
                {treffer.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onAnmelden(n)}
                    className="min-h-10 rounded-full border-2 border-nachmittag bg-nachmittag/15 px-3.5 text-sm font-semibold text-tinte"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <Knopf type="submit" disabled={!offen || !name.trim()}>
              Weiter zum Ei
            </Knopf>
            <SpeicherHinweis status={status} meldung={meldung} />
          </div>
        </form>
      </Karte>

      {namen.length > 0 && (
        <Karte className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-tinte-sanft uppercase">
            Schon dabei ({namen.length})
          </p>
          <p className="mt-1.5 text-sm text-tinte">{namen.join(' · ')}</p>
        </Karte>
      )}
    </div>
  )
}

function EiZeile({
  zeile,
  index,
  gesamt,
  disabled,
  onAendern,
  onEntfernen,
}: {
  zeile: Zeile
  index: number
  gesamt: number
  disabled?: boolean
  onAendern: (zeile: Zeile) => void
  onEntfernen: () => void
}) {
  const istKeins = zeile.art === 'KEINS'
  const istTopf = TOPF_ARTEN.includes(zeile.art)

  return (
    <Karte>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-tinte-sanft uppercase">
          {gesamt > 1 ? `Ei-Wunsch ${index + 1}` : 'Dein Ei'}
        </span>
        {gesamt > 1 && (
          <button
            type="button"
            disabled={disabled}
            onClick={onEntfernen}
            className="min-h-9 rounded-lg px-2 text-xs font-semibold text-beere hover:underline disabled:opacity-40"
          >
            Entfernen
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {EI_KACHELN.map((k) => (
          <Kachel
            key={k.art}
            aktiv={zeile.art === k.art}
            icon={k.icon}
            titel={ART_LABEL[k.art]}
            hinweis={k.hinweis}
            disabled={disabled}
            onClick={() => onAendern({ ...zeile, art: k.art })}
          />
        ))}
      </div>

      {!istKeins && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-end gap-5">
            <Stepper
              label="Anzahl"
              wert={zeile.anzahl}
              min={1}
              max={4}
              disabled={disabled}
              onAendern={(anzahl) => onAendern({ ...zeile, anzahl })}
            />
            <div className="min-w-[180px] flex-1">
              <Segmente
                label="Eigröße"
                werte={GROESSEN}
                aktiv={zeile.groesse}
                disabled={disabled}
                onWaehlen={(groesse) => onAendern({ ...zeile, groesse })}
              />
            </div>
          </div>

          {istTopf && (
            <Schalter
              an={zeile.temperatur === 'KUEHLSCHRANK'}
              disabled={disabled}
              label="Ei kommt aus dem Kühlschrank"
              hinweis="Dann braucht es eine Minute länger im Topf."
              onAendern={(an) => onAendern({ ...zeile, temperatur: an ? 'KUEHLSCHRANK' : 'ZIMMER' })}
            />
          )}

          <div>
            <Feldbeschriftung fuer={`notiz-${index}`}>Notiz zu diesem Ei (optional)</Feldbeschriftung>
            <input
              id={`notiz-${index}`}
              disabled={disabled}
              value={zeile.notiz ?? ''}
              maxLength={200}
              placeholder={istTopf ? 'Bitte nicht zu weich' : 'Mit Schnittlauch, ohne Salz'}
              onChange={(e) => onAendern({ ...zeile, notiz: e.target.value || null })}
              className={eingabeStil}
            />
          </div>
        </div>
      )}
    </Karte>
  )
}

function FrageKarte({
  frage,
  auswahl,
  disabled,
  onAendern,
}: {
  frage: FrageDTO
  auswahl: string[]
  disabled?: boolean
  onAendern: (auswahl: string[]) => void
}) {
  return (
    <Karte>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-lg text-tanne">{frage.text}</h3>
        <span className="shrink-0 text-[0.7rem] font-semibold tracking-wide text-tinte-sanft uppercase">
          {frage.typ === 'MULTI' ? 'Mehrfach' : 'Eine Antwort'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {frage.optionen.map((option) => {
          const aktiv = auswahl.includes(option)
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              aria-pressed={aktiv}
              onClick={() => {
                if (frage.typ === 'SINGLE') {
                  onAendern(aktiv ? [] : [option])
                } else {
                  onAendern(aktiv ? auswahl.filter((a) => a !== option) : [...auswahl, option])
                }
              }}
              className={`min-h-14 rounded-2xl border-2 px-3 py-2.5 text-sm leading-tight font-semibold transition disabled:opacity-50 ${
                aktiv
                  ? 'border-beere bg-beere text-creme'
                  : 'border-creme-rand bg-creme text-tinte hover:border-beere/45'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </Karte>
  )
}

function Zusammenfassung({
  zeilen,
  wunsch,
  antworten,
  fragen,
}: {
  zeilen: Zeile[]
  wunsch: string
  antworten: Record<string, string[]>
  fragen: FrageDTO[]
}) {
  const eier = zeilen.filter((z) => z.art !== 'KEINS')
  const beantwortet = fragen.filter((f) => (antworten[f.id] ?? []).length > 0)

  return (
    <dl className="mt-4 space-y-2.5 border-t border-creme-rand pt-4 text-sm">
      <div className="flex gap-2">
        <dt className="w-24 shrink-0 text-tinte-sanft">Ei</dt>
        <dd className="text-tinte">
          {eier.length === 0 ? 'Kein Ei, danke.' : eier.map(beschreibeBestellung).join(' · ')}
        </dd>
      </div>
      {wunsch.trim() && (
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-tinte-sanft">Wunsch</dt>
          <dd className="whitespace-pre-line text-tinte">{wunsch.trim()}</dd>
        </div>
      )}
      {fragen.length > 0 && (
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-tinte-sanft">Fragen</dt>
          <dd className="text-tinte">
            {beantwortet.length === fragen.length
              ? 'Alle beantwortet ✓'
              : `${beantwortet.length} von ${fragen.length} beantwortet`}
          </dd>
        </div>
      )}
    </dl>
  )
}

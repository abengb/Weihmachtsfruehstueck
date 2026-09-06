'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { lies, schreibe, useIstBrowser, useSpeicher } from '@/lib/browserSpeicher'
import {
  ART_LABEL,
  formatDauer,
  formatMMSS,
  type GeplantesEi,
  type Kochplan,
} from '@/lib/eggTiming'
import { Abschnittstitel, Karte } from './Rahmen'
import { Knopf } from './ui'
import { IconPfanne, IconTopf } from './Illustrationen'

/* Hier taucht die Wespe bewusst nicht auf – beim Kochen soll nichts ablenken. */

type Props = {
  plan: Kochplan
  eventName: string
  eventCode: string
  hostKey: string
}

const VORWARNUNG_SEKUNDEN = 20

export default function KochplanAnsicht({ plan, eventName, eventCode, hostKey }: Props) {
  const router = useRouter()
  const istBrowser = useIstBrowser()

  // Ein laufender Timer übersteht das Neuladen – der Stand liegt im localStorage.
  const timerStand = useSpeicher('local', timerSchluessel(eventCode))

  if (istBrowser && timerStand) {
    return <TimerVollbild plan={plan} eventCode={eventCode} />
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12">
      {/* --- Kopfzeile ------------------------------------------------- */}
      <Karte className="mt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <IconTopf className="h-14 w-14 shrink-0" />
            <div>
              <p className="font-serif text-4xl leading-none text-tanne">
                {plan.topfEierGesamt} {plan.topfEierGesamt === 1 ? 'Ei' : 'Eier'}
              </p>
              <p className="mt-1 text-sm text-tinte-sanft">
                in den Topf
                {plan.toepfe.length > 1 ? ` · verteilt auf ${plan.toepfe.length} Töpfe` : ''}
              </p>
            </div>
          </div>

          <div className="kein-druck flex flex-wrap gap-2">
            <Knopf variante="still" onClick={() => router.refresh()}>
              Neu laden
            </Knopf>
            <Knopf variante="still" onClick={() => window.print()}>
              Drucken
            </Knopf>
            {plan.topfEierGesamt > 0 && (
              <Knopf onClick={() => starteTimer(eventCode)}>Timer starten</Knopf>
            )}
          </div>
        </div>

        {plan.topfEierGesamt > 0 && (
          <p className="mt-4 rounded-xl bg-nachmittag/15 px-3.5 py-2.5 text-sm leading-relaxed text-tinte">
            Wasser sprudelnd kochen lassen, dann <strong>alle Eier gleichzeitig</strong> hinein. Ab
            diesem Moment läuft die Zeit. Schreib vorher mit Bleistift die Nummer auf jede Schale –
            sonst wird das gleich ein Ratespiel.
          </p>
        )}
      </Karte>

      <p className="nur-druck mt-4 text-sm">
        {eventName} · Kochplan · Gesamtdauer {formatDauer(plan.gesamtzeit)}
      </p>

      {/* --- Töpfe ------------------------------------------------------ */}
      {plan.toepfe.length === 0 ? (
        <Karte className="mt-6">
          <p className="text-sm text-tinte-sanft">
            Noch kein einziges Ei für den Topf bestellt. Sobald sich jemand für weich, wachsweich
            oder hart entscheidet, steht hier der Plan.
          </p>
        </Karte>
      ) : (
        <div className="mt-6 space-y-6">
          {plan.toepfe.map((topf) => (
            <div key={topf.nummer} className={topf.nummer > 1 ? 'druck-umbruch' : ''}>
              {plan.toepfe.length > 1 && (
                <Abschnittstitel
                  hinweis={`${topf.eier.length} Eier · fertig nach ${formatDauer(topf.gesamtzeit)}`}
                >
                  Topf {topf.nummer}
                </Abschnittstitel>
              )}
              <Karte>
                <ol className="space-y-3">
                  {topf.entnahmen.map((entnahme) => (
                    <li key={entnahme.sekunden} className="flex gap-4">
                      <span className="w-16 shrink-0 pt-0.5 font-serif text-xl text-beere tabular-nums">
                        {formatMMSS(entnahme.sekunden)}
                      </span>
                      <span className="min-w-0 flex-1 border-l-2 border-creme-rand pl-4">
                        <span className="block text-sm font-semibold text-tinte">
                          {entnahme.eier.map((e) => `Ei ${e.nummer}`).join(', ')} raus
                        </span>
                        <span className="mt-0.5 block text-sm text-tinte-sanft">
                          {beschreibeGruppe(entnahme.eier)}
                        </span>
                        {entnahme.eier
                          .filter((e) => e.notiz)
                          .map((e) => (
                            <span key={e.nummer} className="mt-1 block text-xs text-pflaume">
                              Ei {e.nummer}: {e.notiz}
                            </span>
                          ))}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 border-t border-creme-rand pt-4">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-tinte-sanft uppercase">
                    Nummern auf die Schalen
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {topf.eier.map((ei) => (
                      <span
                        key={ei.nummer}
                        title={`${ei.gastName} · ${ART_LABEL[ei.art]} · ${ei.groesse}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-creme-rand bg-creme-tief px-2.5 py-1 text-xs"
                      >
                        <span className="font-serif text-sm font-bold text-tanne">{ei.nummer}</span>
                        <span className="text-tinte-sanft">{ei.gastName}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </Karte>
            </div>
          ))}
        </div>
      )}

      {/* --- Pfanne ------------------------------------------------------ */}
      {plan.pfanne.length > 0 && (
        <div className="mt-8">
          <Abschnittstitel hinweis="Zählt nicht in den Topf – das läuft nebenher.">
            Pfanne
          </Abschnittstitel>
          <Karte>
            <ul className="space-y-2.5">
              {plan.pfanne.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <IconPfanne className="mt-0.5 h-6 w-6 shrink-0" />
                  <span>
                    <span className="font-semibold text-tinte">
                      {p.anzahl}× {ART_LABEL[p.art]}
                    </span>{' '}
                    <span className="text-tinte-sanft">für {p.gastName}</span>
                    {p.notiz && <span className="mt-0.5 block text-xs text-pflaume">{p.notiz}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-creme-rand pt-3 text-sm text-tinte-sanft">
              Zusammen {plan.pfannenEierGesamt} Eier für die Pfanne.
            </p>
          </Karte>
        </div>
      )}

      {/* --- Sonderwünsche ----------------------------------------------- */}
      {plan.sonderwuensche.length > 0 && (
        <div className="mt-8">
          <Abschnittstitel>Sonderwünsche &amp; Allergien</Abschnittstitel>
          <Karte>
            <ul className="space-y-3">
              {plan.sonderwuensche.map((w, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold text-tinte">{w.gastName}</span>
                  <span className="mt-0.5 block whitespace-pre-line text-tinte-sanft">{w.text}</span>
                </li>
              ))}
            </ul>
          </Karte>
        </div>
      )}

      <div className="kein-druck mt-8">
        <Link href={{ pathname: `/e/${eventCode}/host`, query: { key: hostKey } }}>
          <Knopf variante="still">← Zurück zur Übersicht</Knopf>
        </Link>
      </div>
    </div>
  )
}

function beschreibeGruppe(eier: GeplantesEi[]): string {
  const namen = [...new Set(eier.map((e) => e.gastName))].join(', ')
  const e = eier[0]
  const zusatz = [ART_LABEL[e.art].toLowerCase(), e.groesse]
  if (e.temperatur === 'KUEHLSCHRANK') zusatz.push('Kühlschrank')
  return `${namen} – ${zusatz.join(', ')}`
}

/* ========================================================================
   Live-Timer
   ======================================================================== */

type TimerStand = { start: number | null; pausiertBei: number | null }

function timerSchluessel(eventCode: string) {
  return `wf:timer:${eventCode}`
}

function ladeTimer(eventCode: string): TimerStand | null {
  const roh = lies('local', timerSchluessel(eventCode))
  if (!roh) return null
  try {
    const stand = JSON.parse(roh) as TimerStand
    return typeof stand === 'object' && stand !== null ? stand : null
  } catch {
    return null
  }
}

function sichereTimer(eventCode: string, stand: TimerStand | null) {
  schreibe('local', timerSchluessel(eventCode), stand ? JSON.stringify(stand) : null)
}

function starteTimer(eventCode: string) {
  sichereTimer(eventCode, { start: Date.now(), pausiertBei: null })
}

function TimerVollbild({ plan, eventCode }: { plan: Kochplan; eventCode: string }) {
  const [stand, setStand] = useState<TimerStand>(
    () => ladeTimer(eventCode) ?? { start: Date.now(), pausiertBei: null },
  )
  const [sekunden, setSekunden] = useState(() =>
    stand.pausiertBei !== null ? stand.pausiertBei : stand.start ? (Date.now() - stand.start) / 1000 : 0,
  )

  const audio = useRef<AudioContext | null>(null)
  const gesignalisiert = useRef<Set<string>>(new Set())
  const wakeLock = useRef<WakeLockSentinel | null>(null)

  const laeuft = stand.pausiertBei === null && stand.start !== null

  const verstrichen = useCallback(
    (jetzt = Date.now()) =>
      stand.pausiertBei !== null ? stand.pausiertBei : stand.start ? (jetzt - stand.start) / 1000 : 0,
    [stand],
  )

  // --- Ton (Web Audio, kein externes Asset) ------------------------------
  const piep = useCallback((frequenz: number, dauer: number, verzoegerung = 0) => {
    try {
      audio.current ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const ctx = audio.current
      if (ctx.state === 'suspended') void ctx.resume()
      const start = ctx.currentTime + verzoegerung
      const osz = ctx.createOscillator()
      const huellkurve = ctx.createGain()
      osz.type = 'sine'
      osz.frequency.value = frequenz
      huellkurve.gain.setValueAtTime(0.0001, start)
      huellkurve.gain.exponentialRampToValueAtTime(0.35, start + 0.02)
      huellkurve.gain.exponentialRampToValueAtTime(0.0001, start + dauer)
      osz.connect(huellkurve).connect(ctx.destination)
      osz.start(start)
      osz.stop(start + dauer + 0.05)
    } catch {
      /* ohne Ton geht es zur Not auch */
    }
  }, [])

  const signal = useCallback(
    (art: 'vorwarnung' | 'entnahme') => {
      if (art === 'vorwarnung') {
        piep(880, 0.16)
        navigator.vibrate?.(180)
      } else {
        piep(1320, 0.2)
        piep(1320, 0.2, 0.3)
        piep(1320, 0.35, 0.6)
        navigator.vibrate?.([200, 120, 200, 120, 320])
      }
    },
    [piep],
  )

  // Beim Einstieg (auch nach Neuladen) gilt alles Vergangene als erledigt.
  useEffect(() => {
    const jetzt = verstrichen()
    for (const e of plan.alleEntnahmen) {
      if (jetzt >= e.sekunden - VORWARNUNG_SEKUNDEN) gesignalisiert.current.add(`${e.sekunden}-vor`)
      if (jetzt >= e.sekunden) gesignalisiert.current.add(`${e.sekunden}-jetzt`)
    }
    // Nur einmal beim Aufbau.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Takt --------------------------------------------------------------
  useEffect(() => {
    function takt() {
      const jetzt = verstrichen()
      setSekunden(jetzt)
      if (!laeuft) return
      for (const e of plan.alleEntnahmen) {
        const vor = `${e.sekunden}-vor`
        const jetztSchluessel = `${e.sekunden}-jetzt`
        if (jetzt >= e.sekunden - VORWARNUNG_SEKUNDEN && !gesignalisiert.current.has(vor)) {
          gesignalisiert.current.add(vor)
          if (jetzt < e.sekunden) signal('vorwarnung')
        }
        if (jetzt >= e.sekunden && !gesignalisiert.current.has(jetztSchluessel)) {
          gesignalisiert.current.add(jetztSchluessel)
          signal('entnahme')
        }
      }
    }
    const id = window.setInterval(takt, 250)
    return () => window.clearInterval(id)
  }, [laeuft, verstrichen, plan.alleEntnahmen, signal])

  // --- Display wachhalten -------------------------------------------------
  useEffect(() => {
    let abgebrochen = false

    async function halten() {
      if (!laeuft || !('wakeLock' in navigator)) return
      try {
        const sperre = await navigator.wakeLock.request('screen')
        if (abgebrochen) return void sperre.release()
        wakeLock.current = sperre
      } catch {
        /* Browser mag nicht – dann bleibt der Bildschirm eben nicht an */
      }
    }

    function beiSichtbarkeit() {
      if (document.visibilityState === 'visible') void halten()
    }

    void halten()
    document.addEventListener('visibilitychange', beiSichtbarkeit)
    return () => {
      abgebrochen = true
      document.removeEventListener('visibilitychange', beiSichtbarkeit)
      void wakeLock.current?.release().catch(() => {})
      wakeLock.current = null
    }
  }, [laeuft])

  function pausieren() {
    const neu: TimerStand = { start: null, pausiertBei: verstrichen() }
    setStand(neu)
    sichereTimer(eventCode, neu)
  }

  function weiter() {
    const neu: TimerStand = { start: Date.now() - (stand.pausiertBei ?? 0) * 1000, pausiertBei: null }
    setStand(neu)
    sichereTimer(eventCode, neu)
  }

  function zuruecksetzen() {
    gesignalisiert.current.clear()
    sichereTimer(eventCode, null)
  }

  const naechste = plan.alleEntnahmen.find((e) => e.sekunden > sekunden)
  const folgende = plan.alleEntnahmen.filter((e) => e.sekunden > sekunden).slice(1, 5)
  const erledigt = plan.alleEntnahmen.filter((e) => e.sekunden <= sekunden)
  const restZuNaechster = naechste ? naechste.sekunden - sekunden : 0
  const gleichSoweit = restZuNaechster > 0 && restZuNaechster <= VORWARNUNG_SEKUNDEN

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-tanne-tief text-creme">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-[0.16em] text-nachmittag-hell uppercase">
            {laeuft ? 'Eier sind im Wasser' : 'Pausiert'}
          </span>
          <span className="font-serif text-lg text-creme/70 tabular-nums">
            {formatMMSS(sekunden)}
          </span>
        </div>

        {/* --- Countdown ------------------------------------------------ */}
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          {naechste ? (
            <>
              <p className="text-sm text-creme/70">Nächste Entnahme</p>
              <p
                className={`my-2 font-serif text-[5.5rem] leading-none tabular-nums ${
                  gleichSoweit ? 'text-nachmittag puls-sanft' : 'text-creme'
                }`}
              >
                {formatMMSS(restZuNaechster)}
              </p>
              <p className="font-serif text-2xl text-nachmittag-hell">
                {naechste.eier.map((e) => `Ei ${e.nummer}`).join(', ')}
              </p>
              <p className="mt-1 text-sm text-creme/75">{beschreibeGruppe(naechste.eier)}</p>
              {plan.toepfe.length > 1 && (
                <p className="mt-1 text-xs text-creme/55">Topf {naechste.topfNummer}</p>
              )}
            </>
          ) : (
            <>
              <p className="my-2 font-serif text-5xl text-nachmittag">Alles raus.</p>
              <p className="text-sm text-creme/75">
                Der Topf ist leer. Guten Appetit – und Deckel auf die Marmelade.
              </p>
            </>
          )}
        </div>

        {/* --- Folgeschritte -------------------------------------------- */}
        {folgende.length > 0 && (
          <div className="rounded-karte border border-creme/15 bg-creme/8 p-4">
            <p className="mb-2 text-xs font-semibold tracking-wide text-creme/60 uppercase">
              Danach · Restzeit ab jetzt
            </p>
            <ul className="space-y-1.5 text-sm">
              {folgende.map((e) => (
                <li key={`${e.topfNummer}-${e.sekunden}`} className="flex gap-3">
                  <span className="w-14 shrink-0 text-nachmittag-hell tabular-nums">
                    {formatMMSS(e.sekunden - sekunden)}
                  </span>
                  <span className="text-creme/85">
                    {e.eier.map((x) => `Ei ${x.nummer}`).join(', ')} · {beschreibeGruppe(e.eier)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {erledigt.length > 0 && (
          <p className="mt-3 text-xs text-creme/50">
            Schon draußen: {erledigt.flatMap((e) => e.eier.map((x) => `Ei ${x.nummer}`)).join(', ')}
          </p>
        )}

        {/* --- Steuerung ------------------------------------------------- */}
        <div className="mt-6 flex gap-2">
          {laeuft ? (
            <button
              type="button"
              onClick={pausieren}
              className="min-h-14 flex-1 rounded-xl border-2 border-creme/30 text-base font-semibold text-creme"
            >
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={weiter}
              className="min-h-14 flex-1 rounded-xl bg-nachmittag text-base font-semibold text-tinte"
            >
              Weiter
            </button>
          )}
          <button
            type="button"
            onClick={zuruecksetzen}
            className="min-h-14 flex-1 rounded-xl border-2 border-creme/30 text-base font-semibold text-creme"
          >
            Zurücksetzen
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-creme/45">
          Signal kommt {VORWARNUNG_SEKUNDEN} Sekunden vorher und exakt zur Entnahme.
        </p>
      </div>
    </div>
  )
}

/**
 * Kochzeiten und Topf-Aufteilung für das Weihnachtsfrühstück.
 *
 * Prinzip: Alle Eier eines Topfes gehen gleichzeitig ins sprudelnd kochende
 * Wasser. Die Zeit läuft ab genau diesem Moment. Herausgenommen wird
 * gestaffelt – jedes Ei zu seiner eigenen Sekunde.
 *
 * Bewusst frei von Prisma-Importen, damit die Logik ohne Datenbank testbar ist.
 */

export type EiArt =
  | 'KEINS'
  | 'WEICH'
  | 'WACHSWEICH'
  | 'HART'
  | 'RUEHREI'
  | 'SPIEGELEI'
  | 'POCHIERT'

export type EiGroesse = 'S' | 'M' | 'L' | 'XL'
export type EiTemperatur = 'KUEHLSCHRANK' | 'ZIMMER'

/** Arten, die im Topf gekocht werden und damit im Kochplan auftauchen. */
export const TOPF_ARTEN = ['WEICH', 'WACHSWEICH', 'HART'] as const
export type TopfArt = (typeof TOPF_ARTEN)[number]

/** Arten, die in die Pfanne gehen und nicht mitgezählt werden. */
export const PFANNEN_ARTEN = ['RUEHREI', 'SPIEGELEI', 'POCHIERT'] as const
export type PfannenArt = (typeof PFANNEN_ARTEN)[number]

export function istTopfArt(art: EiArt): art is TopfArt {
  return (TOPF_ARTEN as readonly string[]).includes(art)
}

export function istPfannenArt(art: EiArt): art is PfannenArt {
  return (PFANNEN_ARTEN as readonly string[]).includes(art)
}

/**
 * Alle Zeitwerte in Sekunden. Basis gilt für Größe M bei Zimmertemperatur.
 * Pro Event über die Einstellungsseite nachjustierbar.
 */
export type TimingConfig = {
  zeitWeich: number
  zeitWachsweich: number
  zeitHart: number
  zuschlagKuehl: number
  zuschlagS: number
  zuschlagL: number
  zuschlagXL: number
  topfKapazitaet: number
}

export const STANDARD_TIMING: TimingConfig = {
  zeitWeich: 4 * 60 + 30, // 4:30
  zeitWachsweich: 6 * 60 + 30, // 6:30
  zeitHart: 9 * 60 + 30, // 9:30
  zuschlagKuehl: 60, // +1:00 direkt aus dem Kühlschrank
  zuschlagS: -30, // −0:30
  zuschlagL: 30, // +0:30
  zuschlagXL: 60, // +1:00
  topfKapazitaet: 12,
}

/** Grenzen für die Slider auf der Einstellungsseite. */
export const TIMING_GRENZEN: Record<
  keyof TimingConfig,
  { min: number; max: number; schritt: number; label: string; hinweis: string }
> = {
  zeitWeich: { min: 180, max: 420, schritt: 5, label: 'Weich', hinweis: 'Basis für Größe M, Zimmertemperatur' },
  zeitWachsweich: { min: 300, max: 540, schritt: 5, label: 'Wachsweich', hinweis: 'Basis für Größe M, Zimmertemperatur' },
  zeitHart: { min: 420, max: 780, schritt: 5, label: 'Hart', hinweis: 'Basis für Größe M, Zimmertemperatur' },
  zuschlagKuehl: { min: 0, max: 150, schritt: 5, label: 'Zuschlag Kühlschrank', hinweis: 'Ei kommt direkt aus dem Kühlschrank' },
  zuschlagS: { min: -90, max: 0, schritt: 5, label: 'Zuschlag Größe S', hinweis: 'Normalerweise negativ' },
  zuschlagL: { min: 0, max: 90, schritt: 5, label: 'Zuschlag Größe L', hinweis: '' },
  zuschlagXL: { min: 0, max: 150, schritt: 5, label: 'Zuschlag Größe XL', hinweis: '' },
  topfKapazitaet: { min: 4, max: 24, schritt: 1, label: 'Eier pro Topf', hinweis: 'Darüber wird automatisch ein zweiter Topf geplant' },
}

/**
 * Kochzeit eines einzelnen Eis ab dem Moment, in dem es ins kochende
 * Wasser kommt – inklusive Zuschlägen für Größe und Temperatur.
 * Ergebnis ist nie kleiner als 30 Sekunden.
 */
export function kochzeitSekunden(
  art: EiArt,
  groesse: EiGroesse,
  temperatur: EiTemperatur,
  config: TimingConfig = STANDARD_TIMING,
): number {
  let basis: number
  switch (art) {
    case 'WEICH':
      basis = config.zeitWeich
      break
    case 'WACHSWEICH':
      basis = config.zeitWachsweich
      break
    case 'HART':
      basis = config.zeitHart
      break
    default:
      throw new Error(`Nur Topf-Eier haben eine Kochzeit, nicht: ${art}`)
  }

  let zeit = basis

  if (groesse === 'S') zeit += config.zuschlagS
  if (groesse === 'L') zeit += config.zuschlagL
  if (groesse === 'XL') zeit += config.zuschlagXL
  if (temperatur === 'KUEHLSCHRANK') zeit += config.zuschlagKuehl

  return Math.max(30, Math.round(zeit))
}

/** 270 → "04:30" */
export function formatMMSS(sekunden: number): string {
  const s = Math.max(0, Math.round(sekunden))
  const m = Math.floor(s / 60)
  const rest = s % 60
  return `${String(m).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

/** 270 → "4:30 Min" – für Fließtext */
export function formatDauer(sekunden: number): string {
  const s = Math.max(0, Math.round(sekunden))
  const m = Math.floor(s / 60)
  const rest = s % 60
  return `${m}:${String(rest).padStart(2, '0')} Min`
}

export const ART_LABEL: Record<EiArt, string> = {
  KEINS: 'Kein Ei',
  WEICH: 'Weich',
  WACHSWEICH: 'Wachsweich',
  HART: 'Hart',
  RUEHREI: 'Rührei',
  SPIEGELEI: 'Spiegelei',
  POCHIERT: 'Pochiert',
}

export const TEMPERATUR_LABEL: Record<EiTemperatur, string> = {
  KUEHLSCHRANK: 'Kühlschrank',
  ZIMMER: 'Zimmertemperatur',
}

// ---------------------------------------------------------------------------
// Kochplan
// ---------------------------------------------------------------------------

export type BestellungEingabe = {
  art: EiArt
  anzahl: number
  groesse: EiGroesse
  temperatur: EiTemperatur
  notiz?: string | null
}

export type GastEingabe = {
  id: string
  name: string
  bestellungen: BestellungEingabe[]
  wuensche?: string[]
}

export type GeplantesEi = {
  /** Fortlaufende Nummer über alle Töpfe – die kommt mit Bleistift auf die Schale. */
  nummer: number
  gastId: string
  gastName: string
  art: TopfArt
  groesse: EiGroesse
  temperatur: EiTemperatur
  notiz?: string | null
  kochzeit: number
}

export type Entnahme = {
  /** Sekunden nach dem Eintauchen. */
  sekunden: number
  eier: GeplantesEi[]
}

export type Topf = {
  nummer: number
  eier: GeplantesEi[]
  entnahmen: Entnahme[]
  /** Zeit der letzten Entnahme – dann ist der Topf leer. */
  gesamtzeit: number
}

export type PfannenPosten = {
  gastId: string
  gastName: string
  art: PfannenArt
  anzahl: number
  notiz?: string | null
}

export type Sonderwunsch = {
  gastId: string
  gastName: string
  text: string
}

export type Kochplan = {
  toepfe: Topf[]
  /** Anzahl Eier im Topf gesamt (nur WEICH/WACHSWEICH/HART). */
  topfEierGesamt: number
  pfanne: PfannenPosten[]
  pfannenEierGesamt: number
  sonderwuensche: Sonderwunsch[]
  /** Chronologische Entnahmen über alle Töpfe – Grundlage für den Live-Timer. */
  alleEntnahmen: { sekunden: number; topfNummer: number; eier: GeplantesEi[] }[]
  /** Späteste Entnahme über alle Töpfe. */
  gesamtzeit: number
}

/**
 * Verteilt n Eier möglichst gleichmäßig auf so wenige Töpfe wie nötig.
 * 13 Eier bei Kapazität 12 ergeben 7 + 6, nicht 12 + 1.
 */
export function topfGroessen(anzahlEier: number, kapazitaet: number): number[] {
  if (anzahlEier <= 0) return []
  const kap = Math.max(1, Math.floor(kapazitaet))
  const anzahlToepfe = Math.ceil(anzahlEier / kap)
  const basis = Math.floor(anzahlEier / anzahlToepfe)
  const rest = anzahlEier % anzahlToepfe
  return Array.from({ length: anzahlToepfe }, (_, i) => basis + (i < rest ? 1 : 0))
}

const GROESSEN_RANG: Record<EiGroesse, number> = { S: 0, M: 1, L: 2, XL: 3 }

/**
 * Baut aus allen Bestellungen den kompletten Kochplan.
 * Eier werden nach Kochzeit sortiert und dann auf die Töpfe verteilt,
 * damit jeder Topf eine kompakte Zeitleiste bekommt.
 */
export function erstelleKochplan(
  gaeste: GastEingabe[],
  config: TimingConfig = STANDARD_TIMING,
): Kochplan {
  const topfEier: Omit<GeplantesEi, 'nummer'>[] = []
  const pfanne: PfannenPosten[] = []
  const sonderwuensche: Sonderwunsch[] = []

  for (const gast of gaeste) {
    for (const b of gast.bestellungen) {
      const anzahl = Math.max(0, Math.floor(b.anzahl))
      if (anzahl === 0 || b.art === 'KEINS') continue

      if (istTopfArt(b.art)) {
        const kochzeit = kochzeitSekunden(b.art, b.groesse, b.temperatur, config)
        for (let i = 0; i < anzahl; i++) {
          topfEier.push({
            gastId: gast.id,
            gastName: gast.name,
            art: b.art,
            groesse: b.groesse,
            temperatur: b.temperatur,
            notiz: b.notiz ?? null,
            kochzeit,
          })
        }
      } else if (istPfannenArt(b.art)) {
        pfanne.push({
          gastId: gast.id,
          gastName: gast.name,
          art: b.art,
          anzahl,
          notiz: b.notiz ?? null,
        })
      }
    }

    for (const text of gast.wuensche ?? []) {
      const sauber = text.trim()
      if (sauber) sonderwuensche.push({ gastId: gast.id, gastName: gast.name, text: sauber })
    }
  }

  // Sortierung: nach Kochzeit, dann stabil nach Name/Art/Größe, damit der Plan
  // bei gleichen Daten immer identisch aussieht.
  topfEier.sort(
    (a, b) =>
      a.kochzeit - b.kochzeit ||
      a.gastName.localeCompare(b.gastName, 'de') ||
      a.art.localeCompare(b.art) ||
      GROESSEN_RANG[a.groesse] - GROESSEN_RANG[b.groesse],
  )

  const groessen = topfGroessen(topfEier.length, config.topfKapazitaet)
  const toepfe: Topf[] = []
  let index = 0
  let nummer = 1

  for (let t = 0; t < groessen.length; t++) {
    const eier: GeplantesEi[] = topfEier
      .slice(index, index + groessen[t])
      .map((ei) => ({ ...ei, nummer: nummer++ }))
    index += groessen[t]

    // Gleichzeitige Entnahmen zusammenfassen.
    const nachZeit = new Map<number, GeplantesEi[]>()
    for (const ei of eier) {
      const liste = nachZeit.get(ei.kochzeit)
      if (liste) liste.push(ei)
      else nachZeit.set(ei.kochzeit, [ei])
    }
    const entnahmen: Entnahme[] = [...nachZeit.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([sekunden, eierDerZeit]) => ({ sekunden, eier: eierDerZeit }))

    toepfe.push({
      nummer: t + 1,
      eier,
      entnahmen,
      gesamtzeit: entnahmen.length ? entnahmen[entnahmen.length - 1].sekunden : 0,
    })
  }

  const alleEntnahmen = toepfe
    .flatMap((topf) =>
      topf.entnahmen.map((e) => ({ sekunden: e.sekunden, topfNummer: topf.nummer, eier: e.eier })),
    )
    .sort((a, b) => a.sekunden - b.sekunden || a.topfNummer - b.topfNummer)

  pfanne.sort(
    (a, b) => a.gastName.localeCompare(b.gastName, 'de') || a.art.localeCompare(b.art),
  )

  return {
    toepfe,
    topfEierGesamt: topfEier.length,
    pfanne,
    pfannenEierGesamt: pfanne.reduce((summe, p) => summe + p.anzahl, 0),
    sonderwuensche,
    alleEntnahmen,
    gesamtzeit: alleEntnahmen.length ? alleEntnahmen[alleEntnahmen.length - 1].sekunden : 0,
  }
}

// ---------------------------------------------------------------------------
// Einkaufsliste
// ---------------------------------------------------------------------------

export type Einkaufsliste = {
  gesamt: number
  mitReserve: number
  reserve: number
  nachArt: { art: EiArt; anzahl: number }[]
  nachGroesse: { groesse: EiGroesse; anzahl: number }[]
}

const EINKAUF_ARTEN: EiArt[] = ['WEICH', 'WACHSWEICH', 'HART', 'RUEHREI', 'SPIEGELEI', 'POCHIERT']
const ALLE_GROESSEN: EiGroesse[] = ['S', 'M', 'L', 'XL']

export function erstelleEinkaufsliste(gaeste: GastEingabe[], reserve = 2): Einkaufsliste {
  const nachArt = new Map<EiArt, number>()
  const nachGroesse = new Map<EiGroesse, number>()
  let gesamt = 0

  for (const gast of gaeste) {
    for (const b of gast.bestellungen) {
      const anzahl = Math.max(0, Math.floor(b.anzahl))
      if (anzahl === 0 || b.art === 'KEINS') continue
      gesamt += anzahl
      nachArt.set(b.art, (nachArt.get(b.art) ?? 0) + anzahl)
      nachGroesse.set(b.groesse, (nachGroesse.get(b.groesse) ?? 0) + anzahl)
    }
  }

  return {
    gesamt,
    reserve,
    mitReserve: gesamt > 0 ? gesamt + reserve : 0,
    nachArt: EINKAUF_ARTEN.filter((a) => nachArt.has(a)).map((art) => ({
      art,
      anzahl: nachArt.get(art)!,
    })),
    nachGroesse: ALLE_GROESSEN.filter((g) => nachGroesse.has(g)).map((groesse) => ({
      groesse,
      anzahl: nachGroesse.get(groesse)!,
    })),
  }
}

/**
 * Handgeschriebene, kleine Validierung – die App hat wenige Endpunkte und
 * jede davon nimmt ein überschaubares Objekt entgegen.
 */

import type { EiArt, EiGroesse, EiTemperatur } from './eggTiming'
import type { FrageTyp } from './types'

export const ALLE_ARTEN: EiArt[] = [
  'KEINS',
  'WEICH',
  'WACHSWEICH',
  'HART',
  'RUEHREI',
  'SPIEGELEI',
  'POCHIERT',
]
export const ALLE_GROESSEN: EiGroesse[] = ['S', 'M', 'L', 'XL']
export const ALLE_TEMPERATUREN: EiTemperatur[] = ['KUEHLSCHRANK', 'ZIMMER']

export const MAX_ANZAHL = 4
export const MAX_BESTELLUNGEN = 8
export const MAX_TEXT = 500
export const MAX_OPTIONEN = 12

export class FehlerhafteEingabe extends Error {
  status: number
  constructor(nachricht: string, status = 400) {
    super(nachricht)
    this.status = status
  }
}

export function alsText(wert: unknown, feld: string, maxLaenge = MAX_TEXT): string {
  if (typeof wert !== 'string') throw new FehlerhafteEingabe(`${feld} muss Text sein.`)
  const sauber = wert.trim()
  if (sauber.length > maxLaenge)
    throw new FehlerhafteEingabe(`${feld} ist zu lang (max. ${maxLaenge} Zeichen).`)
  return sauber
}

export function pflichtText(wert: unknown, feld: string, maxLaenge = MAX_TEXT): string {
  const sauber = alsText(wert, feld, maxLaenge)
  if (!sauber) throw new FehlerhafteEingabe(`${feld} darf nicht leer sein.`)
  return sauber
}

export function alsEnum<T extends string>(wert: unknown, erlaubt: T[], feld: string): T {
  if (typeof wert !== 'string' || !erlaubt.includes(wert as T))
    throw new FehlerhafteEingabe(`${feld} hat einen unbekannten Wert.`)
  return wert as T
}

export function alsGanzzahl(wert: unknown, feld: string, min: number, max: number): number {
  const zahl = typeof wert === 'number' ? wert : Number(wert)
  if (!Number.isFinite(zahl)) throw new FehlerhafteEingabe(`${feld} muss eine Zahl sein.`)
  const gerundet = Math.round(zahl)
  if (gerundet < min || gerundet > max)
    throw new FehlerhafteEingabe(`${feld} muss zwischen ${min} und ${max} liegen.`)
  return gerundet
}

export function alsBoolean(wert: unknown, feld: string): boolean {
  if (typeof wert !== 'boolean') throw new FehlerhafteEingabe(`${feld} muss true oder false sein.`)
  return wert
}

export function alsDatum(wert: unknown, feld: string): Date {
  if (typeof wert !== 'string' && !(wert instanceof Date))
    throw new FehlerhafteEingabe(`${feld} muss ein Datum sein.`)
  const datum = wert instanceof Date ? wert : new Date(wert)
  if (Number.isNaN(datum.getTime())) throw new FehlerhafteEingabe(`${feld} ist kein gültiges Datum.`)
  return datum
}

export type BestellungEingabe = {
  art: EiArt
  anzahl: number
  groesse: EiGroesse
  temperatur: EiTemperatur
  notiz: string | null
}

export function pruefeBestellungen(wert: unknown): BestellungEingabe[] {
  if (!Array.isArray(wert)) throw new FehlerhafteEingabe('bestellungen muss eine Liste sein.')
  if (wert.length > MAX_BESTELLUNGEN)
    throw new FehlerhafteEingabe(`Höchstens ${MAX_BESTELLUNGEN} Ei-Zeilen pro Gast.`)

  return wert.map((roh, i) => {
    if (typeof roh !== 'object' || roh === null)
      throw new FehlerhafteEingabe(`Bestellung ${i + 1} ist ungültig.`)
    const b = roh as Record<string, unknown>
    const art = alsEnum(b.art, ALLE_ARTEN, `Bestellung ${i + 1}: art`)
    const notizRoh = b.notiz
    return {
      art,
      // "Kein Ei" ist immer genau eine Zeile mit Anzahl 1.
      anzahl: art === 'KEINS' ? 1 : alsGanzzahl(b.anzahl, `Bestellung ${i + 1}: anzahl`, 1, MAX_ANZAHL),
      groesse: alsEnum(b.groesse ?? 'M', ALLE_GROESSEN, `Bestellung ${i + 1}: groesse`),
      temperatur: alsEnum(
        b.temperatur ?? 'KUEHLSCHRANK',
        ALLE_TEMPERATUREN,
        `Bestellung ${i + 1}: temperatur`,
      ),
      notiz: notizRoh == null || notizRoh === '' ? null : alsText(notizRoh, `Bestellung ${i + 1}: notiz`, 200),
    }
  })
}

export function pruefeAntworten(wert: unknown): Record<string, string[]> {
  if (typeof wert !== 'object' || wert === null)
    throw new FehlerhafteEingabe('antworten muss ein Objekt sein.')
  const ergebnis: Record<string, string[]> = {}
  for (const [frageId, auswahl] of Object.entries(wert as Record<string, unknown>)) {
    if (!Array.isArray(auswahl)) throw new FehlerhafteEingabe('Jede Antwort muss eine Liste sein.')
    ergebnis[frageId] = auswahl
      .slice(0, MAX_OPTIONEN)
      .map((a) => alsText(a, 'Antwortoption', 200))
      .filter(Boolean)
  }
  return ergebnis
}

export function pruefeOptionen(wert: unknown): string[] {
  if (!Array.isArray(wert)) throw new FehlerhafteEingabe('optionen muss eine Liste sein.')
  const optionen = wert.map((o) => alsText(o, 'Option', 120)).filter(Boolean)
  if (optionen.length < 2) throw new FehlerhafteEingabe('Bitte mindestens zwei Antwortoptionen.')
  if (optionen.length > MAX_OPTIONEN)
    throw new FehlerhafteEingabe(`Höchstens ${MAX_OPTIONEN} Antwortoptionen.`)
  if (new Set(optionen).size !== optionen.length)
    throw new FehlerhafteEingabe('Die Antwortoptionen müssen sich unterscheiden.')
  return optionen
}

export const ALLE_FRAGETYPEN: FrageTyp[] = ['SINGLE', 'MULTI']

/** Namen vergleichbar machen: "  anna " und "Anna" sind dieselbe Person. */
export function namensSchluessel(name: string): string {
  return name.trim().toLocaleLowerCase('de').replace(/\s+/g, ' ')
}

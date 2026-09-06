import { ART_LABEL, istTopfArt, type EiArt, type EiGroesse, type EiTemperatur } from './eggTiming'

/** "2× Weich (L, Kühlschrank)" – und für KEINS schlicht "Kein Ei". */
export function beschreibeBestellung(b: {
  art: EiArt
  anzahl: number
  groesse: EiGroesse
  temperatur: EiTemperatur
}): string {
  if (b.art === 'KEINS') return 'Kein Ei'
  const zusatz: string[] = [b.groesse]
  if (istTopfArt(b.art) && b.temperatur === 'KUEHLSCHRANK') zusatz.push('Kühlschrank')
  return `${b.anzahl}× ${ART_LABEL[b.art]} (${zusatz.join(', ')})`
}

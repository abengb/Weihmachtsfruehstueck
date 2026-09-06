import type { EiArt, EiGroesse, EiTemperatur, TimingConfig } from './eggTiming'

export type FrageTyp = 'SINGLE' | 'MULTI'

export type BestellungDTO = {
  id: string
  art: EiArt
  anzahl: number
  groesse: EiGroesse
  temperatur: EiTemperatur
  notiz: string | null
}

export type GastDTO = {
  id: string
  name: string
  bestellungen: BestellungDTO[]
  /** Sonderwünsche / Allergien / "bringe Lachs mit" als ein Freitext. */
  wunsch: string
  /** questionId → gewählte Optionen */
  antworten: Record<string, string[]>
}

export type FrageDTO = {
  id: string
  text: string
  typ: FrageTyp
  optionen: string[]
  aktiv: boolean
}

export type EventDTO = {
  name: string
  datum: string
  eventCode: string
  deadline: string | null
  locked: boolean
  /** false, wenn gesperrt oder die Deadline durch ist. */
  offen: boolean
}

export type HostExtras = {
  hostKey: string
  bruchReserve: number
  timing: TimingConfig
}

export type EventState = {
  event: EventDTO
  gaeste: GastDTO[]
  fragen: FrageDTO[]
  host?: HostExtras
}

/** Was der Gast beim Speichern schickt – alles optional, alles idempotent. */
export type GastUpdate = {
  bestellungen?: Omit<BestellungDTO, 'id'>[]
  wunsch?: string
  antworten?: Record<string, string[]>
  name?: string
}

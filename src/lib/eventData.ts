import 'server-only'
import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import type { EventState, FrageDTO, GastDTO } from './types'
import type { GastEingabe, TimingConfig } from './eggTiming'

const EVENT_INCLUDE = {
  guests: {
    orderBy: { createdAt: 'asc' },
    include: {
      orders: { orderBy: { createdAt: 'asc' } },
      wuensche: { orderBy: { createdAt: 'asc' } },
      answers: true,
    },
  },
  questions: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.EventInclude

export type EventMitAllem = Prisma.EventGetPayload<{ include: typeof EVENT_INCLUDE }>

export async function ladeEvent(eventCode: string): Promise<EventMitAllem | null> {
  if (!eventCode) return null
  return prisma.event.findUnique({
    where: { eventCode: eventCode.toLowerCase() },
    include: EVENT_INCLUDE,
  })
}

/** Der Gastgeber-Key wird zeitkonstant genug verglichen – hier reicht das. */
export function istHost(event: { hostKey: string }, key: string | null | undefined): boolean {
  if (!key) return false
  const a = Buffer.from(event.hostKey)
  const b = Buffer.from(key)
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/** Dürfen Gäste gerade noch etwas ändern? */
export function istOffen(event: { locked: boolean; deadline: Date | null }, jetzt = new Date()): boolean {
  if (event.locked) return false
  if (event.deadline && jetzt.getTime() > event.deadline.getTime()) return false
  return true
}

export function timingAusEvent(event: {
  zeitWeich: number
  zeitWachsweich: number
  zeitHart: number
  zuschlagKuehl: number
  zuschlagS: number
  zuschlagL: number
  zuschlagXL: number
  topfKapazitaet: number
}): TimingConfig {
  return {
    zeitWeich: event.zeitWeich,
    zeitWachsweich: event.zeitWachsweich,
    zeitHart: event.zeitHart,
    zuschlagKuehl: event.zuschlagKuehl,
    zuschlagS: event.zuschlagS,
    zuschlagL: event.zuschlagL,
    zuschlagXL: event.zuschlagXL,
    topfKapazitaet: event.topfKapazitaet,
  }
}

export function gastDTO(gast: EventMitAllem['guests'][number]): GastDTO {
  const antworten: Record<string, string[]> = {}
  for (const a of gast.answers) antworten[a.questionId] = a.auswahl

  return {
    id: gast.id,
    name: gast.name,
    bestellungen: gast.orders.map((o) => ({
      id: o.id,
      art: o.art,
      anzahl: o.anzahl,
      groesse: o.groesse,
      temperatur: o.temperatur,
      notiz: o.notiz,
    })),
    wunsch: gast.wuensche.map((w) => w.text).join('\n'),
    antworten,
  }
}

export function frageDTO(frage: EventMitAllem['questions'][number]): FrageDTO {
  return {
    id: frage.id,
    text: frage.text,
    typ: frage.typ,
    optionen: frage.optionen,
    aktiv: frage.aktiv,
  }
}

export function eventState(event: EventMitAllem, alsHost: boolean): EventState {
  const state: EventState = {
    event: {
      name: event.name,
      datum: event.datum.toISOString(),
      eventCode: event.eventCode,
      deadline: event.deadline?.toISOString() ?? null,
      locked: event.locked,
      offen: istOffen(event),
    },
    gaeste: event.guests.map(gastDTO),
    fragen: event.questions.filter((f) => alsHost || f.aktiv).map(frageDTO),
  }

  if (alsHost) {
    state.host = {
      hostKey: event.hostKey,
      bruchReserve: event.bruchReserve,
      timing: timingAusEvent(event),
    }
  }

  return state
}

/** Übersetzt die geladenen Gäste in die Eingabe für Kochplan und Einkaufsliste. */
export function planEingabe(event: EventMitAllem): GastEingabe[] {
  return event.guests.map((gast) => ({
    id: gast.id,
    name: gast.name,
    bestellungen: gast.orders.map((o) => ({
      art: o.art,
      anzahl: o.anzahl,
      groesse: o.groesse,
      temperatur: o.temperatur,
      notiz: o.notiz,
    })),
    wuensche: gast.wuensche.map((w) => w.text),
  }))
}

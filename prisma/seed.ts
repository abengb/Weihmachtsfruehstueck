/**
 * Beispiel-Event "Weihnachtsfrühstück Schrickel" mit 8 Gästen, gemischten
 * Ei-Wünschen und zwei Gastgeber-Fragen.
 *
 *   npm run seed
 *
 * Läuft mehrfach: ein bestehendes Seed-Event wird vorher entfernt.
 * Mit SEED_EVENT_CODE / SEED_HOST_KEY lassen sich feste Codes vorgeben.
 */

import { PrismaClient, type EiArt, type EiGroesse, type EiTemperatur } from '@prisma/client'
import { neuerEventCode, neuerHostKey } from '../src/lib/codes'

const prisma = new PrismaClient()

type Bestellung = {
  art: EiArt
  anzahl?: number
  groesse?: EiGroesse
  temperatur?: EiTemperatur
  notiz?: string
}

const GAESTE: { name: string; bestellungen: Bestellung[]; wunsch?: string }[] = [
  {
    name: 'Anna',
    bestellungen: [{ art: 'WEICH', groesse: 'M', temperatur: 'KUEHLSCHRANK' }],
    wunsch: 'Nussallergie – bitte kein Nussmus auf den Tisch.',
  },
  {
    name: 'Jörg',
    bestellungen: [{ art: 'WEICH', groesse: 'L', temperatur: 'ZIMMER' }],
  },
  {
    name: 'Tino',
    bestellungen: [{ art: 'WEICH', anzahl: 2, groesse: 'L', temperatur: 'ZIMMER' }],
    wunsch: 'Ich bringe den Lachs mit.',
  },
  {
    name: 'Britta',
    bestellungen: [{ art: 'WACHSWEICH', groesse: 'M', temperatur: 'KUEHLSCHRANK' }],
  },
  {
    name: 'Hendrik',
    bestellungen: [
      { art: 'HART', anzahl: 2, groesse: 'XL', temperatur: 'KUEHLSCHRANK' },
      { art: 'RUEHREI', groesse: 'M', notiz: 'mit Schnittlauch' },
    ],
  },
  {
    name: 'Marlies',
    bestellungen: [{ art: 'SPIEGELEI', anzahl: 2, groesse: 'L', notiz: 'Dotter bitte flüssig' }],
    wunsch: 'Bringe Franzbrötchen mit.',
  },
  {
    name: 'Kai',
    bestellungen: [{ art: 'POCHIERT', groesse: 'M' }],
  },
  {
    name: 'Silke',
    bestellungen: [{ art: 'KEINS' }],
    wunsch: 'Kein Ei, dafür doppelt Kaffee.',
  },
]

const FRAGEN = [
  {
    text: 'Was bringst du mit?',
    typ: 'MULTI' as const,
    optionen: ['Brötchen', 'Kuchen', 'Obst', 'Saft', 'Käse', 'Nichts, ich komme nur hungrig'],
  },
  {
    text: 'Drinnen oder draußen frühstücken?',
    typ: 'SINGLE' as const,
    optionen: ['Draußen im Garten', 'Drinnen am großen Tisch', 'Ist mir egal'],
  },
]

const ANTWORTEN: Record<string, [string[], string[]]> = {
  // Name: [Antwort auf Frage 1, Antwort auf Frage 2]
  Anna: [['Brötchen', 'Obst'], ['Draußen im Garten']],
  Jörg: [['Saft'], ['Draußen im Garten']],
  Tino: [['Käse'], ['Drinnen am großen Tisch']],
  Britta: [['Kuchen'], ['Draußen im Garten']],
  Hendrik: [['Brötchen'], ['Ist mir egal']],
  Marlies: [['Kuchen', 'Obst'], ['Draußen im Garten']],
  Kai: [[], []], // hat noch nicht geantwortet – dafür ist die Auswertung da
  Silke: [['Nichts, ich komme nur hungrig'], ['Drinnen am großen Tisch']],
}

async function main() {
  const name = 'Weihnachtsfrühstück Schrickel'

  const alt = await prisma.event.findFirst({ where: { name } })
  if (alt) {
    await prisma.event.delete({ where: { id: alt.id } })
    console.log(`Altes Seed-Event entfernt (${alt.eventCode}).`)
  }

  // Nächster 3. Advent ist weit weg – das Frühstück ist ja im September.
  const datum = new Date()
  datum.setDate(datum.getDate() + 14)
  datum.setHours(10, 0, 0, 0)

  const deadline = new Date(datum)
  deadline.setDate(deadline.getDate() - 1)
  deadline.setHours(20, 0, 0, 0)

  const event = await prisma.event.create({
    data: {
      name,
      datum,
      deadline,
      eventCode: (process.env.SEED_EVENT_CODE ?? neuerEventCode()).toLowerCase(),
      hostKey: process.env.SEED_HOST_KEY ?? neuerHostKey(),
    },
  })

  const fragen = []
  for (const f of FRAGEN) {
    fragen.push(await prisma.question.create({ data: { ...f, eventId: event.id } }))
  }

  for (const g of GAESTE) {
    const gast = await prisma.guest.create({ data: { eventId: event.id, name: g.name } })

    for (const b of g.bestellungen) {
      await prisma.eggOrder.create({
        data: {
          guestId: gast.id,
          art: b.art,
          anzahl: b.anzahl ?? 1,
          groesse: b.groesse ?? 'M',
          temperatur: b.temperatur ?? 'KUEHLSCHRANK',
          notiz: b.notiz ?? null,
        },
      })
    }

    if (g.wunsch) await prisma.wunsch.create({ data: { guestId: gast.id, text: g.wunsch } })

    const auswahl = ANTWORTEN[g.name]
    if (auswahl) {
      for (let i = 0; i < fragen.length; i++) {
        if (!auswahl[i]?.length) continue
        await prisma.answer.create({
          data: { questionId: fragen[i].id, guestId: gast.id, auswahl: auswahl[i] },
        })
      }
    }
  }

  const basis = process.env.APP_URL ?? 'http://localhost:3000'
  console.log('\nFertig. Zwei Links:\n')
  console.log(`  Gäste:     ${basis}/e/${event.eventCode}`)
  console.log(`  Gastgeber: ${basis}/e/${event.eventCode}/host?key=${event.hostKey}\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

import { describe, expect, it } from 'vitest'
import {
  STANDARD_TIMING,
  erstelleEinkaufsliste,
  erstelleKochplan,
  formatDauer,
  formatMMSS,
  kochzeitSekunden,
  topfGroessen,
  type GastEingabe,
  type TimingConfig,
} from './eggTiming'

const zimmer = 'ZIMMER' as const
const kuehl = 'KUEHLSCHRANK' as const

function gast(name: string, bestellungen: GastEingabe['bestellungen'], wuensche: string[] = []): GastEingabe {
  return { id: `id-${name}`, name, bestellungen, wuensche }
}

describe('kochzeitSekunden – Basiswerte', () => {
  it('trifft die Basiszeiten für Größe M bei Zimmertemperatur', () => {
    expect(kochzeitSekunden('WEICH', 'M', zimmer)).toBe(270) // 4:30
    expect(kochzeitSekunden('WACHSWEICH', 'M', zimmer)).toBe(390) // 6:30
    expect(kochzeitSekunden('HART', 'M', zimmer)).toBe(570) // 9:30
  })

  it('rechnet den Kühlschrank-Zuschlag von +1:00 drauf', () => {
    expect(kochzeitSekunden('WEICH', 'M', kuehl)).toBe(330) // 5:30
    expect(kochzeitSekunden('HART', 'M', kuehl)).toBe(630) // 10:30
  })

  it('berücksichtigt die Eigröße', () => {
    expect(kochzeitSekunden('WEICH', 'S', zimmer)).toBe(240) // −0:30
    expect(kochzeitSekunden('WEICH', 'M', zimmer)).toBe(270)
    expect(kochzeitSekunden('WEICH', 'L', zimmer)).toBe(300) // +0:30
    expect(kochzeitSekunden('WEICH', 'XL', zimmer)).toBe(330) // +1:00
  })

  it('kombiniert Größe und Temperatur additiv', () => {
    // 4:30 + 1:00 (XL) + 1:00 (Kühlschrank) = 6:30
    expect(kochzeitSekunden('WEICH', 'XL', kuehl)).toBe(390)
    // 9:30 − 0:30 (S) + 1:00 (Kühlschrank) = 10:00
    expect(kochzeitSekunden('HART', 'S', kuehl)).toBe(600)
  })

  it('nutzt die pro Event angepassten Werte', () => {
    const config: TimingConfig = { ...STANDARD_TIMING, zeitWeich: 300, zuschlagKuehl: 45 }
    expect(kochzeitSekunden('WEICH', 'M', kuehl, config)).toBe(345)
    // Andere Arten bleiben unberührt
    expect(kochzeitSekunden('HART', 'M', zimmer, config)).toBe(570)
  })

  it('fällt nie unter 30 Sekunden', () => {
    const config: TimingConfig = { ...STANDARD_TIMING, zeitWeich: 40, zuschlagS: -300 }
    expect(kochzeitSekunden('WEICH', 'S', zimmer, config)).toBe(30)
  })

  it('wirft bei Arten ohne Topfzeit', () => {
    expect(() => kochzeitSekunden('RUEHREI', 'M', zimmer)).toThrow()
    expect(() => kochzeitSekunden('KEINS', 'M', zimmer)).toThrow()
  })
})

describe('Formatierung', () => {
  it('formatiert mm:ss', () => {
    expect(formatMMSS(270)).toBe('04:30')
    expect(formatMMSS(0)).toBe('00:00')
    expect(formatMMSS(630)).toBe('10:30')
    expect(formatMMSS(-5)).toBe('00:00')
  })

  it('formatiert Fließtext-Dauer', () => {
    expect(formatDauer(270)).toBe('4:30 Min')
    expect(formatDauer(600)).toBe('10:00 Min')
  })
})

describe('topfGroessen – Aufteilung', () => {
  it('braucht keinen Topf ohne Eier', () => {
    expect(topfGroessen(0, 12)).toEqual([])
  })

  it('nutzt einen Topf bis zur Kapazität', () => {
    expect(topfGroessen(1, 12)).toEqual([1])
    expect(topfGroessen(12, 12)).toEqual([12])
  })

  it('teilt ab 13 Eiern gleichmäßig auf zwei Töpfe auf', () => {
    expect(topfGroessen(13, 12)).toEqual([7, 6])
    expect(topfGroessen(14, 12)).toEqual([7, 7])
    expect(topfGroessen(24, 12)).toEqual([12, 12])
  })

  it('nutzt drei Töpfe ab 25 Eiern', () => {
    expect(topfGroessen(25, 12)).toEqual([9, 8, 8])
    expect(topfGroessen(36, 12)).toEqual([12, 12, 12])
  })

  it('behält die Gesamtzahl bei und überschreitet nie die Kapazität', () => {
    for (let n = 1; n <= 60; n++) {
      for (const kap of [4, 6, 10, 12, 20]) {
        const groessen = topfGroessen(n, kap)
        expect(groessen.reduce((a, b) => a + b, 0)).toBe(n)
        expect(Math.max(...groessen)).toBeLessThanOrEqual(kap)
        // Höchstens 1 Ei Unterschied zwischen dem vollsten und dem leersten Topf
        expect(Math.max(...groessen) - Math.min(...groessen)).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('erstelleKochplan', () => {
  it('liefert einen leeren Plan ohne Bestellungen', () => {
    const plan = erstelleKochplan([])
    expect(plan.toepfe).toEqual([])
    expect(plan.topfEierGesamt).toBe(0)
    expect(plan.gesamtzeit).toBe(0)
  })

  it('zählt nur Topf-Eier in den Topf, Pfanne und "kein Ei" bleiben draußen', () => {
    const plan = erstelleKochplan([
      gast('Anna', [{ art: 'WEICH', anzahl: 1, groesse: 'M', temperatur: kuehl }]),
      gast('Bert', [{ art: 'RUEHREI', anzahl: 2, groesse: 'M', temperatur: zimmer, notiz: 'mit Schnittlauch' }]),
      gast('Cem', [{ art: 'KEINS', anzahl: 1, groesse: 'M', temperatur: zimmer }]),
    ])

    expect(plan.topfEierGesamt).toBe(1)
    expect(plan.toepfe).toHaveLength(1)
    expect(plan.pfanne).toHaveLength(1)
    expect(plan.pfannenEierGesamt).toBe(2)
    expect(plan.pfanne[0]).toMatchObject({ gastName: 'Bert', art: 'RUEHREI', anzahl: 2, notiz: 'mit Schnittlauch' })
  })

  it('macht aus anzahl=3 auch drei einzeln nummerierte Eier', () => {
    const plan = erstelleKochplan([
      gast('Anna', [{ art: 'HART', anzahl: 3, groesse: 'M', temperatur: zimmer }]),
    ])
    expect(plan.topfEierGesamt).toBe(3)
    expect(plan.toepfe[0].eier.map((e) => e.nummer)).toEqual([1, 2, 3])
    // Gleiche Zeit → eine gemeinsame Entnahme
    expect(plan.toepfe[0].entnahmen).toHaveLength(1)
    expect(plan.toepfe[0].entnahmen[0].sekunden).toBe(570)
    expect(plan.toepfe[0].entnahmen[0].eier).toHaveLength(3)
  })

  it('staffelt die Entnahmen aufsteigend und fasst gleiche Zeiten zusammen', () => {
    const plan = erstelleKochplan([
      gast('Anna', [{ art: 'WEICH', anzahl: 1, groesse: 'M', temperatur: kuehl }]), // 330
      gast('Jörg', [{ art: 'WEICH', anzahl: 1, groesse: 'L', temperatur: zimmer }]), // 300
      gast('Tino', [{ art: 'WEICH', anzahl: 1, groesse: 'L', temperatur: zimmer }]), // 300
      gast('Uwe', [{ art: 'HART', anzahl: 1, groesse: 'M', temperatur: zimmer }]), // 570
    ])

    const topf = plan.toepfe[0]
    expect(topf.entnahmen.map((e) => e.sekunden)).toEqual([300, 330, 570])
    expect(topf.entnahmen[0].eier.map((e) => e.gastName)).toEqual(['Jörg', 'Tino'])
    expect(topf.entnahmen[1].eier.map((e) => e.gastName)).toEqual(['Anna'])
    expect(topf.gesamtzeit).toBe(570)
    expect(plan.gesamtzeit).toBe(570)
  })

  it('nummeriert fortlaufend über alle Töpfe hinweg', () => {
    const plan = erstelleKochplan([
      gast('Anna', [{ art: 'WEICH', anzahl: 20, groesse: 'M', temperatur: zimmer }]),
    ])
    expect(plan.toepfe).toHaveLength(2)
    expect(plan.toepfe.map((t) => t.eier.length)).toEqual([10, 10])
    expect(plan.toepfe[0].eier[0].nummer).toBe(1)
    expect(plan.toepfe[1].eier[0].nummer).toBe(11)
    const alle = plan.toepfe.flatMap((t) => t.eier.map((e) => e.nummer))
    expect(new Set(alle).size).toBe(20)
  })

  it('respektiert eine abweichende Topfkapazität', () => {
    const config: TimingConfig = { ...STANDARD_TIMING, topfKapazitaet: 6 }
    const plan = erstelleKochplan(
      [gast('Anna', [{ art: 'WEICH', anzahl: 13, groesse: 'M', temperatur: zimmer }])],
      config,
    )
    expect(plan.toepfe.map((t) => t.eier.length)).toEqual([5, 4, 4])
  })

  it('sortiert Eier nach Kochzeit, damit jeder Topf eine kompakte Leiste hat', () => {
    const plan = erstelleKochplan([
      gast('Anna', [{ art: 'HART', anzahl: 1, groesse: 'M', temperatur: zimmer }]), // 570
      gast('Bert', [{ art: 'WEICH', anzahl: 1, groesse: 'S', temperatur: zimmer }]), // 240
    ])
    const zeiten = plan.toepfe[0].eier.map((e) => e.kochzeit)
    expect(zeiten).toEqual([240, 570])
    expect(plan.toepfe[0].eier[0].gastName).toBe('Bert')
  })

  it('erlaubt einem Gast mehrere Bestellzeilen', () => {
    const plan = erstelleKochplan([
      gast('Anna', [
        { art: 'WEICH', anzahl: 1, groesse: 'M', temperatur: kuehl },
        { art: 'RUEHREI', anzahl: 1, groesse: 'M', temperatur: zimmer },
      ]),
    ])
    expect(plan.topfEierGesamt).toBe(1)
    expect(plan.pfannenEierGesamt).toBe(1)
  })

  it('sammelt Sonderwünsche und ignoriert leere Einträge', () => {
    const plan = erstelleKochplan([
      gast('Anna', [], ['Bringe Lachs mit', '   ']),
      gast('Bert', [], ['Nussallergie']),
    ])
    expect(plan.sonderwuensche).toEqual([
      { gastId: 'id-Anna', gastName: 'Anna', text: 'Bringe Lachs mit' },
      { gastId: 'id-Bert', gastName: 'Bert', text: 'Nussallergie' },
    ])
  })

  it('führt alle Entnahmen über alle Töpfe chronologisch zusammen', () => {
    const config: TimingConfig = { ...STANDARD_TIMING, topfKapazitaet: 2 }
    const plan = erstelleKochplan(
      [
        gast('Anna', [{ art: 'WEICH', anzahl: 2, groesse: 'M', temperatur: zimmer }]), // 270
        gast('Bert', [{ art: 'HART', anzahl: 2, groesse: 'M', temperatur: zimmer }]), // 570
      ],
      config,
    )
    expect(plan.toepfe).toHaveLength(2)
    expect(plan.alleEntnahmen.map((e) => e.sekunden)).toEqual([270, 570])
    expect(plan.alleEntnahmen[0].topfNummer).toBe(1)
    expect(plan.alleEntnahmen[1].topfNummer).toBe(2)
  })

  it('ist deterministisch – gleiche Eingabe, gleicher Plan', () => {
    const eingabe = [
      gast('Zoe', [{ art: 'WEICH', anzahl: 2, groesse: 'L', temperatur: kuehl }]),
      gast('Anna', [{ art: 'WEICH', anzahl: 2, groesse: 'L', temperatur: kuehl }]),
    ]
    expect(JSON.stringify(erstelleKochplan(eingabe))).toBe(JSON.stringify(erstelleKochplan(eingabe)))
    expect(erstelleKochplan(eingabe).toepfe[0].eier[0].gastName).toBe('Anna')
  })
})

describe('erstelleEinkaufsliste', () => {
  it('zählt alle Eier inklusive Pfanne und schlägt die Bruch-Reserve auf', () => {
    const liste = erstelleEinkaufsliste(
      [
        gast('Anna', [{ art: 'WEICH', anzahl: 2, groesse: 'M', temperatur: kuehl }]),
        gast('Bert', [{ art: 'RUEHREI', anzahl: 3, groesse: 'L', temperatur: zimmer }]),
        gast('Cem', [{ art: 'KEINS', anzahl: 1, groesse: 'M', temperatur: zimmer }]),
      ],
      2,
    )
    expect(liste.gesamt).toBe(5)
    expect(liste.mitReserve).toBe(7)
    expect(liste.nachArt).toEqual([
      { art: 'WEICH', anzahl: 2 },
      { art: 'RUEHREI', anzahl: 3 },
    ])
    expect(liste.nachGroesse).toEqual([
      { groesse: 'M', anzahl: 2 },
      { groesse: 'L', anzahl: 3 },
    ])
  })

  it('schlägt ohne Bestellungen keine Reserve auf', () => {
    expect(erstelleEinkaufsliste([], 2).mitReserve).toBe(0)
  })

  it('nimmt eine abweichende Reserve', () => {
    const liste = erstelleEinkaufsliste(
      [gast('Anna', [{ art: 'HART', anzahl: 4, groesse: 'M', temperatur: zimmer }])],
      5,
    )
    expect(liste.mitReserve).toBe(9)
  })
})

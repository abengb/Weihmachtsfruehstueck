#!/usr/bin/env node
/**
 * Sucht die Datenbank-Verbindung im GANZEN Netlify-Konto und traegt sie beim
 * richtigen Projekt als DATABASE_URL ein.
 *
 * Hintergrund: "netlify env:list" zeigt nur, was am verknuepften Projekt
 * haengt. Wird eine Netlify-Datenbank versehentlich in einem anderen Projekt
 * angelegt - und bei neun Projekten mit Zufallsnamen passiert das schnell -,
 * dann existiert die Variable, kommt aber nie dort an, wo sie gebraucht wird.
 * Dieses Skript sieht deshalb bei jedem Projekt des Kontos nach.
 *
 * Werte werden NIE ausgegeben. In einer Verbindungs-URL steht das Passwort,
 * und Build-Logs sind lesbar. Ausgegeben werden nur Namen und Laengen.
 *
 * Aufruf:  NETLIFY_AUTH_TOKEN=... node scripts/netlify-datenbank-suchen.mjs <site-id>
 */

const token = process.env.NETLIFY_AUTH_TOKEN
const zielSiteId = process.argv[2]

if (!token) {
  console.error('NETLIFY_AUTH_TOKEN fehlt.')
  process.exit(1)
}
if (!zielSiteId) {
  console.error('Aufruf: node scripts/netlify-datenbank-suchen.mjs <site-id>')
  process.exit(1)
}

const BASIS = 'https://api.netlify.com/api/v1'

async function api(pfad, optionen = {}) {
  const antwort = await fetch(BASIS + pfad, {
    ...optionen,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(optionen.headers ?? {}),
    },
  })
  if (!antwort.ok) {
    const text = await antwort.text()
    throw new Error(`${optionen.method ?? 'GET'} ${pfad} → ${antwort.status} ${text.slice(0, 200)}`)
  }
  return antwort.status === 204 ? null : antwort.json()
}

/** Namen, unter denen eine Postgres-Verbindung ankommen kann. */
const INTERESSANT = /DATABASE_URL|POSTGRES|NEON/i

/** Reihenfolge, in der eine gefundene Verbindung uebernommen wird. */
const VORZUG = [
  'DATABASE_URL',
  'NETLIFY_DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'NETLIFY_DATABASE_URL_UNPOOLED',
  'DATABASE_URL_UNPOOLED',
]

/**
 * Netlify haelt pro Variable mehrere Werte, einen je Kontext. "all" gilt
 * ueberall, sonst hat production Vorrang.
 */
function ersterWert(variable) {
  const werte = variable?.values ?? []
  const alle = werte.find((w) => w.context === 'all')
  const prod = werte.find((w) => w.context === 'production')
  return (alle ?? prod ?? werte[0])?.value ?? ''
}

const sites = await api('/sites?per_page=200')
const zielSite = sites.find((s) => s.id === zielSiteId)

if (!zielSite) {
  console.error(`Projekt ${zielSiteId} ist unter diesem Token nicht sichtbar.`)
  process.exit(1)
}

console.log(`Ziel-Projekt: ${zielSite.name}`)
console.log(`Durchsucht werden ${sites.length} Projekte des Kontos.`)
console.log('')

const funde = []

for (const site of sites) {
  const accountId = site.account_slug ?? site.account_id
  if (!accountId) continue
  let variablen
  try {
    variablen = await api(`/accounts/${accountId}/env?site_id=${site.id}`)
  } catch {
    continue // Kein Zugriff auf dieses Projekt – dann eben nicht.
  }
  const treffer = (variablen ?? []).filter((v) => INTERESSANT.test(v.key))
  if (treffer.length === 0) continue

  console.log(`  ${site.name}${site.id === zielSiteId ? '   ← Ziel' : ''}`)
  for (const v of treffer) {
    const laenge = ersterWert(v).length
    console.log(`      ${v.key}  (${laenge} Zeichen)`)
    funde.push({ site: site.name, siteId: site.id, accountId, key: v.key, laenge })
  }
}

if (funde.length === 0) {
  console.log('  Nirgends im Konto steht eine Datenbank-Variable.')
  console.log('ergebnis=keine')
  process.exit(0)
}

const beimZiel = funde.filter((f) => f.siteId === zielSiteId && f.laenge > 0)
if (beimZiel.some((f) => f.key === 'DATABASE_URL')) {
  console.log('')
  console.log('DATABASE_URL liegt bereits beim Ziel-Projekt.')
  console.log('ergebnis=vorhanden')
  process.exit(0)
}

const quelle =
  VORZUG.map((k) => beimZiel.find((f) => f.key === k)).find(Boolean) ??
  VORZUG.map((k) => funde.find((f) => f.key === k && f.laenge > 0)).find(Boolean)

if (!quelle) {
  console.log('')
  console.log('Es gibt Variablennamen, aber keinen lesbaren Wert dahinter.')
  console.log('ergebnis=keine')
  process.exit(0)
}

console.log('')
console.log(
  quelle.siteId === zielSiteId
    ? `Uebernehme ${quelle.key} aus demselben Projekt als DATABASE_URL.`
    : `Die Datenbank haengt am Projekt "${quelle.site}". Verbindung wird ins Ziel-Projekt kopiert.`,
)

const variablenDerQuelle = await api(`/accounts/${quelle.accountId}/env?site_id=${quelle.siteId}`)
const gepoolt = ersterWert(variablenDerQuelle.find((v) => v.key === quelle.key))
const ungepoolt =
  ersterWert(variablenDerQuelle.find((v) => /UNPOOLED/i.test(v.key))) || gepoolt

if (!gepoolt) {
  console.log('Der Wert kam leer zurueck (moeglicherweise als geheim markiert).')
  console.log('ergebnis=keine')
  process.exit(0)
}

const zielAccount = zielSite.account_slug ?? zielSite.account_id

async function setzen(key, wert) {
  // Erst anlegen; existiert die Variable schon, den Wert aktualisieren.
  try {
    await api(`/accounts/${zielAccount}/env?site_id=${zielSiteId}`, {
      method: 'POST',
      body: JSON.stringify([
        {
          key,
          scopes: ['builds', 'functions', 'runtime'],
          values: [{ context: 'all', value: wert }],
        },
      ]),
    })
  } catch {
    await api(`/accounts/${zielAccount}/env/${key}?site_id=${zielSiteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ context: 'all', value: wert }),
    })
  }
  console.log(`  ${key} gesetzt (${wert.length} Zeichen).`)
}

await setzen('DATABASE_URL', gepoolt)
await setzen('DIRECT_URL', ungepoolt)

console.log('')
console.log('ergebnis=gesetzt')

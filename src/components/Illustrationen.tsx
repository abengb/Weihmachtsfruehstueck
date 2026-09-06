/**
 * Alle Illustrationen als schlanke Inline-SVGs – keine externen Assets,
 * kein Icon-Paket. Motive: Weihnachten, das im Spätsommer im Garten steht.
 */

type SvgProps = { className?: string }

/**
 * Der Zweig hängt im Kopf auf dunklem Tannengrün – dort braucht er helle
 * Töne, sonst verschwindet er in der Fläche.
 */
type Ton = 'hell' | 'dunkel'

const TOENE = {
  dunkel: {
    tanne: '#1e4d3b',
    beere: '#a11b2e',
    beereHell: '#c8465a',
    holz: '#6b4a2b',
    blatt: '#7ea24f',
  },
  hell: {
    tanne: '#a9c9a8',
    beere: '#e07385',
    beereHell: '#f0a3ad',
    holz: '#c2a184',
    blatt: '#b8d48c',
  },
} as const

/* ---------------------------------------------------------------------------
   Tannenzweig neben Apfelbaumzweig – die Grundidee der ganzen App in einem Bild
   --------------------------------------------------------------------------- */
export function TannenUndApfelzweig({ className, ton = 'dunkel' }: SvgProps & { ton?: Ton }) {
  const f = TOENE[ton]
  return (
    <svg viewBox="0 0 240 96" className={className} role="presentation" aria-hidden="true">
      {/* Tannenzweig, von links */}
      <g stroke={f.tanne} strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M6 62 C34 58 62 52 92 44" />
        {[
          [20, 60],
          [33, 57],
          [46, 54],
          [59, 50],
          [72, 47],
          [84, 44],
        ].map(([x, y], i) => (
          <g key={i}>
            <path d={`M${x} ${y} l-7 -13`} />
            <path d={`M${x} ${y} l-3 -16`} />
            <path d={`M${x} ${y} l6 -12`} />
            <path d={`M${x} ${y} l-6 12`} />
            <path d={`M${x} ${y} l4 13`} />
          </g>
        ))}
      </g>
      {/* Beeren am Tannenzweig */}
      <circle cx="41" cy="62" r="4" fill={f.beere} />
      <circle cx="52" cy="65" r="3.2" fill={f.beere} />
      <circle cx="46" cy="70" r="2.6" fill={f.beereHell} />

      {/* Apfelbaumzweig, von rechts */}
      <g stroke={f.holz} strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M234 40 C210 46 186 54 158 58" />
        <path d="M198 51 l10 -12" />
        <path d="M176 56 l-8 -13" />
      </g>
      {/* Apfelblätter */}
      <g fill={f.blatt}>
        <path d="M206 40 c8 -9 18 -9 21 -2 -6 8 -16 9 -21 2Z" />
        <path d="M168 43 c-9 -7 -9 -17 -2 -20 7 6 8 15 2 20Z" />
        <path d="M186 60 c-10 3 -18 -3 -17 -10 9 -1 16 4 17 10Z" />
      </g>
      {/* Äpfel */}
      <g>
        <circle cx="193" cy="66" r="9" fill={f.beere} />
        <path d="M193 57 v-5" stroke={f.holz} strokeWidth="2" strokeLinecap="round" />
        <circle cx="215" cy="59" r="6.5" fill={f.beereHell} />
        <path d="M215 52.5 v-4" stroke={f.holz} strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   Weihnachtskugel, die im Gartenbaum hängt
   --------------------------------------------------------------------------- */
export function KugelImGartenbaum({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 120 140" className={className} role="presentation" aria-hidden="true">
      {/* Ast */}
      <path
        d="M2 26 C30 22 62 20 118 16"
        stroke="#6b4a2b"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M40 24 l12 -12 M74 20 l-10 -13 M96 18 l14 -10" stroke="#6b4a2b" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Sommerblätter am Ast */}
      <g fill="#7ea24f">
        <path d="M52 12 c9 -8 19 -6 21 1 -7 7 -17 6 -21 -1Z" />
        <path d="M64 7 c-8 -8 -7 -17 1 -19 6 7 5 16 -1 19Z" />
        <path d="M110 8 c9 -5 17 0 16 7 -8 2 -15 -2 -16 -7Z" />
        <path d="M28 22 c-9 -6 -10 -15 -3 -18 7 5 8 14 3 18Z" />
      </g>
      {/* Aufhängung */}
      <path d="M60 22 v16" stroke="#e4a93f" strokeWidth="2.6" fill="none" />
      <rect x="53" y="37" width="14" height="9" rx="2.5" fill="#e4a93f" />
      {/* Kugel */}
      <circle cx="60" cy="82" r="36" fill="#a11b2e" />
      <path d="M24 82 a36 36 0 0 0 72 0" fill="#8b1526" opacity="0.35" />
      <path d="M26 70 q34 14 68 0" stroke="#e4a93f" strokeWidth="3.2" fill="none" opacity="0.9" />
      <path d="M28 95 q32 12 64 0" stroke="#7ea24f" strokeWidth="3" fill="none" opacity="0.85" />
      {/* Glanzlicht: Spätsommersonne, nicht Winterkerze */}
      <ellipse cx="46" cy="65" rx="9" ry="6" fill="#f4d79a" opacity="0.6" transform="rotate(-28 46 65)" />
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   Lichterkette über einem Gartenzaun
   --------------------------------------------------------------------------- */
export function LichterketteAmZaun({ className }: SvgProps) {
  const lampen = [
    { x: 26, y: 39, farbe: '#e4a93f' },
    { x: 58, y: 47, farbe: '#a11b2e' },
    { x: 92, y: 50, farbe: '#7ea24f' },
    { x: 126, y: 47, farbe: '#6e3b5c' },
    { x: 158, y: 39, farbe: '#e4a93f' },
    { x: 188, y: 30, farbe: '#a11b2e' },
  ]
  return (
    <svg viewBox="0 0 220 110" className={className} role="presentation" aria-hidden="true">
      {/* Zaunlatten */}
      <g fill="#f2e8d5" stroke="#c9b48c" strokeWidth="1.6">
        {[10, 36, 62, 88, 114, 140, 166, 192].map((x) => (
          <path key={x} d={`M${x} 108 v-38 l7 -8 l7 8 v38Z`} />
        ))}
      </g>
      <path d="M4 82 H216 M4 98 H216" stroke="#c9b48c" strokeWidth="3.4" strokeLinecap="round" />
      {/* Kabel */}
      <path
        d="M6 22 Q60 62 110 52 Q166 40 214 12"
        stroke="#1e4d3b"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Lampen */}
      {lampen.map((l, i) => (
        <g key={i}>
          <path d={`M${l.x} ${l.y - 6} v5`} stroke="#1e4d3b" strokeWidth="1.8" />
          <ellipse cx={l.x} cy={l.y + 4} rx="5.4" ry="7" fill={l.farbe} />
          <ellipse cx={l.x - 1.6} cy={l.y + 1.5} rx="1.6" ry="2.4" fill="#fcf7ec" opacity="0.55" />
        </g>
      ))}
      {/* Grün, das den Zaun hochwächst – es ist ja noch Sommer */}
      <g stroke="#7ea24f" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M196 108 q-8 -16 2 -26 q10 -8 4 -20" />
        <path d="M200 90 q10 -3 12 -10" />
        <path d="M198 74 q-10 -2 -13 -9" />
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   Gedeckter Kaffeetisch draußen
   --------------------------------------------------------------------------- */
export function KaffeetischDraussen({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 220 130" className={className} role="presentation" aria-hidden="true">
      {/* Tischplatte + Decke */}
      <path d="M16 62 H204 l-10 16 H26Z" fill="#f2e8d5" stroke="#c9b48c" strokeWidth="1.6" />
      <path d="M26 78 q14 10 22 0 q14 10 26 0 q14 10 26 0 q14 10 26 0 q14 10 26 0 q14 10 22 0" fill="none" stroke="#a11b2e" strokeWidth="2.2" />
      <path d="M46 78 v42 M174 78 v42 M110 78 v42" stroke="#6b4a2b" strokeWidth="4" strokeLinecap="round" />

      {/* Kanne */}
      <g>
        <path d="M62 60 v-22 q0 -5 5 -5 h18 q5 0 5 5 v22Z" fill="#1e4d3b" />
        <path d="M90 42 q12 2 12 10 q0 8 -12 8" fill="none" stroke="#1e4d3b" strokeWidth="3.4" />
        <rect x="68" y="27" width="16" height="6" rx="3" fill="#e4a93f" />
      </g>

      {/* Zwei Tassen */}
      {[112, 146].map((x) => (
        <g key={x}>
          <path d={`M${x} 60 v-13 h20 v13Z`} fill="#fcf7ec" stroke="#c9b48c" strokeWidth="1.6" />
          <path d={`M${x + 20} 50 q7 1 7 5 q0 5 -7 5`} fill="none" stroke="#c9b48c" strokeWidth="2" />
          <path d={`M${x - 4} 61 h28`} stroke="#c9b48c" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      ))}

      {/* Eierbecher mit Ei – darum geht es hier schließlich */}
      <g>
        <ellipse cx="182" cy="38" rx="9" ry="11" fill="#fcf7ec" stroke="#c9b48c" strokeWidth="1.4" />
        <path d="M173 44 q9 18 18 0" fill="#e4a93f" />
        <path d="M175 60 h14 l-3 -14 h-8Z" fill="#7ea24f" />
      </g>

      {/* Kerze, die niemand anzündet, weil es 24 Grad hat */}
      <g>
        <rect x="34" y="38" width="9" height="22" rx="2" fill="#a11b2e" />
        <path d="M38.5 38 v-6" stroke="#2b241c" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   Astern und Sonnenblumen neben dem Adventsgesteck
   --------------------------------------------------------------------------- */
export function AsternUndAdventsgesteck({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 240 130" className={className} role="presentation" aria-hidden="true">
      {/* Sonnenblume */}
      <g>
        <path d="M42 128 V70" stroke="#7ea24f" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M42 100 q-16 -6 -20 -18 q16 -2 20 12Z" fill="#7ea24f" />
        <path d="M42 112 q16 -6 21 -18 q-17 -3 -21 12Z" fill="#7ea24f" />
        <g fill="#e4a93f">
          {Array.from({ length: 12 }, (_, i) => {
            const w = (i * Math.PI * 2) / 12
            const x = 42 + Math.cos(w) * 19
            const y = 62 + Math.sin(w) * 19
            return <ellipse key={i} cx={x} cy={y} rx="8" ry="4.6" transform={`rotate(${(i * 360) / 12} ${x} ${y})`} />
          })}
        </g>
        <circle cx="42" cy="62" r="11" fill="#6b4a2b" />
      </g>

      {/* Astern in Pflaume */}
      {[
        { x: 92, y: 78, r: 9, farbe: '#6e3b5c' },
        { x: 114, y: 92, r: 7.5, farbe: '#8f5580' },
        { x: 78, y: 98, r: 7, farbe: '#6e3b5c' },
      ].map((a, i) => (
        <g key={i}>
          <path d={`M${a.x} 128 V${a.y + a.r}`} stroke="#7ea24f" strokeWidth="2.6" strokeLinecap="round" />
          <g fill={a.farbe}>
            {Array.from({ length: 10 }, (_, k) => {
              const w = (k * Math.PI * 2) / 10
              const x = a.x + Math.cos(w) * a.r
              const y = a.y + Math.sin(w) * a.r
              return <ellipse key={k} cx={x} cy={y} rx={a.r * 0.55} ry={a.r * 0.28} transform={`rotate(${(k * 360) / 10} ${x} ${y})`} />
            })}
          </g>
          <circle cx={a.x} cy={a.y} r={a.r * 0.42} fill="#e4a93f" />
        </g>
      ))}

      {/* Adventsgesteck: Tannenkranz mit vier Kerzen */}
      <g transform="translate(148 0)">
        <ellipse cx="46" cy="106" rx="46" ry="15" fill="#1e4d3b" />
        <ellipse cx="46" cy="102" rx="46" ry="15" fill="#3d7358" />
        <ellipse cx="46" cy="102" rx="20" ry="6.5" fill="#1e4d3b" />
        {/* Zweigstruktur */}
        <g stroke="#1e4d3b" strokeWidth="1.6" opacity="0.6">
          {Array.from({ length: 14 }, (_, i) => {
            const w = (i * Math.PI * 2) / 14
            return <path key={i} d={`M${46 + Math.cos(w) * 26} ${102 + Math.sin(w) * 8} l${Math.cos(w) * 17} ${Math.sin(w) * 6}`} />
          })}
        </g>
        {/* Beeren */}
        <circle cx="16" cy="99" r="3.4" fill="#a11b2e" />
        <circle cx="72" cy="106" r="3" fill="#a11b2e" />
        <circle cx="46" cy="114" r="2.8" fill="#a11b2e" />
        {/* Kerzen */}
        {[
          { x: 18, h: 30 },
          { x: 36, h: 38 },
          { x: 56, h: 38 },
          { x: 74, h: 30 },
        ].map((k) => (
          <g key={k.x}>
            <rect x={k.x} y={98 - k.h} width="11" height={k.h} rx="2.5" fill="#fcf7ec" stroke="#e3d6bd" strokeWidth="1.2" />
            <path d={`M${k.x + 5.5} ${98 - k.h} v-5`} stroke="#2b241c" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ))}
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   Glinde im Footer: Kupfermühle mit Mühlrad (Wahrzeichen, Mühlrad im
   Stadtwappen, erstmals 1229 urkundlich erwähnt, seit 1985 Museum),
   die Glinder Au davor, Marktplatz mit Rathaus und Brunnen.
   --------------------------------------------------------------------------- */
export function GlindeSkyline({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 320 84" className={className} role="img" aria-label="Glinde: Kupfermühle mit Mühlrad an der Glinder Au, Marktplatz mit Rathaus und Brunnen">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {/* Bäume links – die Au ist grün */}
        <path d="M10 70 v-12 M10 58 l-8 8 M10 58 l8 8 M10 62 l-6 6 M10 62 l6 6" />
        <path d="M26 70 v-9 M26 61 l-6 7 M26 61 l6 7" />

        {/* Kupfermühle: Fachwerkhaus mit Satteldach */}
        <path d="M42 70 V40 l22 -14 l22 14 v30" />
        <path d="M42 40 h44" />
        <path d="M56 70 V54 h16 v16" />
        <path d="M64 26 v-6" />
        {/* Mühlrad an der Seite – das Rad, das im Stadtwappen steht */}
        <circle cx="98" cy="56" r="14" />
        <circle cx="98" cy="56" r="3.4" />
        <path d="M98 42 v28 M84 56 h28 M88 46 l20 20 M108 46 l-20 20" />

        {/* Glinder Au – fließt vor der Mühle durch */}
        <path d="M2 76 q16 -5 32 0 t32 0 t32 0 t32 0" opacity="0.75" />
        <path d="M2 82 q16 -5 32 0 t32 0 t32 0 t32 0 t32 0 t32 0" opacity="0.45" />

        {/* Villa Bode, gehörte ursprünglich zum Mühlengrundstück */}
        <path d="M124 70 V48 h26 v22" />
        <path d="M120 48 l17 -10 l17 10" />
        <path d="M132 70 V60 h10 v10" />

        {/* Rathaus am Marktplatz mit Uhr */}
        <path d="M170 70 V36 h34 v34" />
        <path d="M166 36 l21 -12 l21 12" />
        <circle cx="187" cy="46" r="5" />
        <path d="M187 46 v-3 M187 46 l2.5 2" />
        <path d="M176 70 V58 h8 v12 M192 70 V58 h8 v12" />

        {/* Brunnen auf dem Marktplatz */}
        <path d="M216 70 v-8 h16 v8" />
        <path d="M224 62 v-12" />
        <path d="M224 50 q-7 4 -8 12 M224 50 q7 4 8 12" />

        {/* Bürgerhaus Marcellin-Verbe, flach und breit */}
        <path d="M244 70 V50 h40 v20" />
        <path d="M244 50 h40" />
        <path d="M252 70 V58 h9 v12 M268 70 V58 h9 v12" />

        {/* Skulptur "Balance" auf dem Marktplatz, 1993 */}
        <path d="M298 70 v-16" />
        <path d="M290 54 h16" />
        <circle cx="298" cy="48" r="5" />

        {/* Grundlinie */}
        <path d="M0 70 H320" opacity="0.35" />
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   Marmeladenglas – Spätsommer im Regal, und ein guter Sitzplatz für Wespen
   --------------------------------------------------------------------------- */
export function Marmeladenglas({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 84 104" className={className} role="presentation" aria-hidden="true">
      {/* Glas */}
      <path d="M14 30 h56 v58 q0 8 -8 8 H22 q-8 0 -8 -8Z" fill="#f2e8d5" stroke="#c9b48c" strokeWidth="2" />
      {/* Marmelade */}
      <path d="M18 48 h48 v40 q0 4 -4 4 H22 q-4 0 -4 -4Z" fill="#a11b2e" />
      <path d="M18 48 q12 6 24 0 q12 -6 24 0 v6 q-12 6 -24 0 q-12 -6 -24 0Z" fill="#c8465a" />
      {/* Deckel mit Stoffhaube */}
      <path d="M10 30 q32 -14 64 0 q-4 8 -32 8 q-28 0 -32 -8Z" fill="#7ea24f" />
      <path d="M12 26 q30 -12 60 0" stroke="#1e4d3b" strokeWidth="2" fill="none" />
      {/* Etikett */}
      <rect x="24" y="60" width="36" height="20" rx="3" fill="#fcf7ec" opacity="0.92" />
      <path d="M30 68 h24 M30 74 h16" stroke="#c9b48c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   Ei-Icons für die Auswahlkacheln
   --------------------------------------------------------------------------- */

function EiForm({ fill = '#fcf7ec', stroke = '#c9b48c' }: { fill?: string; stroke?: string }) {
  return <path d="M24 6 c9 0 15 12 15 22 c0 9 -6 16 -15 16 c-9 0 -15 -7 -15 -16 c0 -10 6 -22 15 -22Z" fill={fill} stroke={stroke} strokeWidth="2" />
}

export function IconKeinEi({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      <g opacity="0.45">
        <EiForm />
      </g>
      <path d="M11 39 L37 11" stroke="#a11b2e" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  )
}

/** Weich: aufgeschlagen, der Dotter läuft. */
export function IconWeich({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      <path d="M12 44 V26 c0 -10 5 -20 12 -20 c7 0 12 10 12 20 v18Z" fill="#fcf7ec" stroke="#c9b48c" strokeWidth="2" />
      <path d="M12 26 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" fill="none" stroke="#c9b48c" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="24" cy="32" r="7" fill="#e4a93f" />
      <path d="M24 39 q-3 6 0 9 q3 -3 0 -9Z" fill="#e4a93f" />
    </svg>
  )
}

/** Wachsweich: Dotter fest am Rand, weich in der Mitte. */
export function IconWachsweich({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      <EiForm />
      <path d="M9 30 h30" stroke="#c9b48c" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="24" cy="30" r="8.5" fill="#f4d79a" />
      <circle cx="24" cy="30" r="4.5" fill="#e4a93f" />
    </svg>
  )
}

/** Hart: durchgehend fester Dotter, halbiert. */
export function IconHart({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      <EiForm />
      <ellipse cx="24" cy="30" rx="9" ry="8" fill="#e4a93f" />
      <path d="M9.5 22 q14 5 29 0" stroke="#c9b48c" strokeWidth="1.6" fill="none" opacity="0.7" />
    </svg>
  )
}

export function IconRuehrei({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      <path d="M6 30 q6 -10 14 -5 q4 -11 12 -6 q9 -3 10 8 q2 10 -8 12 H16 q-10 -1 -10 -9Z" fill="#e4a93f" />
      <path d="M14 28 q4 -4 8 0 M26 24 q4 -4 8 1" stroke="#f4d79a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M6 39 h36" stroke="#7ea24f" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function IconSpiegelei({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      <path d="M10 24 q-2 -10 8 -11 q4 -7 12 -3 q10 -2 10 8 q6 5 1 12 q1 9 -9 8 q-6 5 -12 0 q-10 1 -10 -7 q-4 -5 0 -7Z" fill="#fcf7ec" stroke="#e3d6bd" strokeWidth="1.6" />
      <circle cx="24" cy="25" r="8" fill="#e4a93f" />
      <ellipse cx="21" cy="22" rx="2.6" ry="1.8" fill="#f4d79a" />
    </svg>
  )
}

export function IconPochiert({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      <path d="M8 40 q4 -5 8 0 q4 5 8 0 q4 -5 8 0 q4 5 8 0" stroke="#3d7358" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M12 28 q-1 -12 12 -12 q13 0 12 12 q0 9 -12 9 q-12 0 -12 -9Z" fill="#fcf7ec" stroke="#e3d6bd" strokeWidth="1.6" />
      <circle cx="24" cy="26" r="6.5" fill="#e4a93f" opacity="0.85" />
      {/* Dampf */}
      <path d="M18 12 q3 -4 0 -8 M24 10 q3 -5 0 -9 M30 12 q3 -4 0 -8" stroke="#c9b48c" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

export function IconTopf({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      <path d="M8 20 h32 v14 q0 8 -8 8 H16 q-8 0 -8 -8Z" fill="#1e4d3b" />
      <path d="M4 20 h40" stroke="#1e4d3b" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 24 h5 q3 0 3 4 t-3 4 h-5" fill="none" stroke="#1e4d3b" strokeWidth="3" />
      <path d="M14 14 q3 -5 0 -10 M24 12 q3 -6 0 -11 M34 14 q3 -5 0 -10" stroke="#c9b48c" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function IconPfanne({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      <ellipse cx="20" cy="30" rx="16" ry="11" fill="#2b241c" />
      <ellipse cx="20" cy="28" rx="16" ry="11" fill="#4a4038" />
      <ellipse cx="20" cy="28" rx="11" ry="7" fill="#2b241c" />
      <path d="M36 27 h11" stroke="#6b4a2b" strokeWidth="4" strokeLinecap="round" />
      <circle cx="20" cy="27" r="4.5" fill="#e4a93f" />
    </svg>
  )
}

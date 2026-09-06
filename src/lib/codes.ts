import { customAlphabet } from 'nanoid'

// Ohne 0/O/1/I/l – damit niemand den Link falsch abtippt, wenn er ihn vorliest.
const LESBAR = '23456789abcdefghijkmnpqrstuvwxyz'

/** Kurzer Gäste-Code für /e/[eventCode] – landet per WhatsApp bei allen. */
export const neuerEventCode = customAlphabet(LESBAR, 8)

/** Geheimer Gastgeber-Key – deutlich länger, der wird nicht geteilt. */
export const neuerHostKey = customAlphabet(LESBAR, 24)

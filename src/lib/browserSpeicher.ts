'use client'

/**
 * localStorage und sessionStorage als externer Store, den React über
 * useSyncExternalStore abonniert. So bleibt der Server-Render leer, die
 * Hydration passt, und niemand muss Zustand in einem Effekt nachziehen.
 */

import { useCallback, useSyncExternalStore } from 'react'

export type SpeicherArt = 'local' | 'session'

const hoerer = new Set<() => void>()

function melde() {
  for (const h of hoerer) h()
}

function abonniere(rueckruf: () => void) {
  hoerer.add(rueckruf)
  // Andere Tabs derselben App melden sich über das storage-Event.
  window.addEventListener('storage', rueckruf)
  return () => {
    hoerer.delete(rueckruf)
    window.removeEventListener('storage', rueckruf)
  }
}

function speicher(art: SpeicherArt): Storage | null {
  try {
    return art === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    // Privater Modus oder blockierte Cookies – dann eben ohne Gedächtnis.
    return null
  }
}

export function lies(art: SpeicherArt, schluessel: string): string | null {
  try {
    return speicher(art)?.getItem(schluessel) ?? null
  } catch {
    return null
  }
}

export function schreibe(art: SpeicherArt, schluessel: string, wert: string | null) {
  try {
    const s = speicher(art)
    if (!s) return
    if (wert === null) s.removeItem(schluessel)
    else s.setItem(schluessel, wert)
  } catch {
    /* nicht schlimm */
  } finally {
    melde()
  }
}

/** Aktueller Wert eines Schlüssels – aktualisiert sich bei jedem Schreiben. */
export function useSpeicher(art: SpeicherArt, schluessel: string): string | null {
  const schnappschuss = useCallback(() => lies(art, schluessel), [art, schluessel])
  return useSyncExternalStore(abonniere, schnappschuss, () => null)
}

/** false beim Server-Render und in der Hydration, danach true. */
export function useIstBrowser(): boolean {
  return useSyncExternalStore(
    abonniere,
    () => true,
    () => false,
  )
}

/**
 * Eine Zufallszahl, die pro Seitenaufruf genau einmal gezogen wird und danach
 * stabil bleibt – gelesen über useSyncExternalStore, damit sie nicht im Render
 * neu entsteht. Beim Server-Render ist sie 0.
 */
let wurfDerSeite: number | null = null

const wurfStore = {
  abonniere: () => () => {},
  jetzt: () => (wurfDerSeite ??= Math.random()),
  aufDemServer: () => 0,
}

export function useSeitenWurf(): number {
  return useSyncExternalStore(wurfStore.abonniere, wurfStore.jetzt, wurfStore.aufDemServer)
}

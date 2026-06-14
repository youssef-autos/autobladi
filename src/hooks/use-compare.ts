"use client"

import { useCallback, useSyncExternalStore } from "react"

const KEY = "autobladi.compare"
const EVENT = "autobladi-compare-change"
export const COMPARE_MAX = 4

export type ToggleResult = "added" | "removed" | "full"

const EMPTY: string[] = []
// Cache so getSnapshot returns a stable reference when the raw value is
// unchanged (required by useSyncExternalStore to avoid render loops).
let cachedRaw: string | null = null
let cachedVal: string[] = EMPTY

function parse(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.filter((s) => typeof s === "string") : EMPTY
  } catch {
    return EMPTY
  }
}

function getSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY
  const raw = localStorage.getItem(KEY) ?? "[]"
  if (raw === cachedRaw) return cachedVal
  cachedRaw = raw
  cachedVal = parse(raw)
  return cachedVal
}

function getServerSnapshot(): string[] {
  return EMPTY
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange()
  }
  window.addEventListener(EVENT, onChange)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener("storage", onStorage)
  }
}

function persist(next: string[]) {
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(EVENT))
}

/**
 * localStorage-backed selection of annonce slugs to compare (max 4),
 * synced across components (same tab via a custom event) and tabs (storage
 * event) through useSyncExternalStore.
 */
export function useCompare() {
  const slugs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback((slug: string): ToggleResult => {
    const cur = getSnapshot()
    if (cur.includes(slug)) {
      persist(cur.filter((s) => s !== slug))
      return "removed"
    }
    if (cur.length >= COMPARE_MAX) return "full"
    persist([...cur, slug])
    return "added"
  }, [])

  const remove = useCallback(
    (slug: string) => persist(getSnapshot().filter((s) => s !== slug)),
    [],
  )

  const clear = useCallback(() => persist([]), [])

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs])

  return { slugs, count: slugs.length, max: COMPARE_MAX, toggle, remove, clear, has }
}

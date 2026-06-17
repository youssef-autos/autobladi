"use client"

import { useEffect, useState } from "react"

/**
 * SSR-safe media-query hook. Starts `false` on the server and first client
 * render, then resolves to the real value after mount — pair it with a
 * `mounted` flag (or CSS-driven sizing) when you must avoid a layout shift.
 *
 * An `active` flag guards the state update so a `change` event handled after the
 * effect is torn down (e.g. React StrictMode's double-mount in dev) is ignored.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    let active = true
    const mql = window.matchMedia(query)
    const onChange = () => {
      if (active) setMatches(mql.matches)
    }
    onChange()
    mql.addEventListener("change", onChange)
    return () => {
      active = false
      mql.removeEventListener("change", onChange)
    }
  }, [query])

  return matches
}

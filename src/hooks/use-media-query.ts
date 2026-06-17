"use client"

import { useEffect, useState } from "react"

/**
 * SSR-safe media-query hook. Starts `false` on the server and first client
 * render, then resolves to the real value after mount — pair it with a
 * `mounted` flag (or CSS-driven sizing) when you must avoid a layout shift.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}

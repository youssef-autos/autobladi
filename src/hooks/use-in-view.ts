"use client"

import { useEffect, useState, type RefObject } from "react"

/**
 * Returns true once the referenced element scrolls within `rootMargin` of the
 * viewport. Fires once then disconnects — ideal for lazy-mounting ads/images
 * below the fold. Falls back to `true` immediately when IntersectionObserver is
 * unavailable (very old browsers / SSR safety).
 */
export function useInView(
  ref: RefObject<Element | null>,
  rootMargin = "200px",
): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, rootMargin])

  return inView
}

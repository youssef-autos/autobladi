"use client"

import { startTransition, useEffect, useState, type RefObject } from "react"

/**
 * Returns true once the referenced element scrolls within `rootMargin` of the
 * viewport. Fires once then disconnects — ideal for lazy-mounting ads/images
 * below the fold. Falls back to `true` immediately when IntersectionObserver is
 * unavailable (very old browsers / SSR safety).
 *
 * An `active` flag guards every state update so a callback that fires after the
 * effect is torn down (e.g. React StrictMode's double-mount in dev) is ignored.
 */
export function useInView(
  ref: RefObject<Element | null>,
  rootMargin = "200px",
): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let active = true

    if (typeof IntersectionObserver === "undefined") {
      startTransition(() => setInView(true))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (active && entries[0]?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)

    return () => {
      active = false
      observer.disconnect()
    }
  }, [ref, rootMargin])

  return inView
}

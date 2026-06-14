"use client"

import { useEffect } from "react"

type Props = {
  annonceId: string
}

/**
 * Fires a single POST to /api/annonces/[id]/view after mount.
 * Uses sessionStorage to skip refresh-spam within the same browser session,
 * and the server still applies an IP-based dedup window.
 */
export function ViewTracker({ annonceId }: Props) {
  useEffect(() => {
    if (!annonceId) return
    const key = `viewed:${annonceId}`
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) {
      return
    }
    fetch(`/api/annonces/${annonceId}/view`, { method: "POST" })
      .then(() => {
        try {
          sessionStorage?.setItem(key, "1")
        } catch {
          // ignore — sessionStorage may be unavailable
        }
      })
      .catch(() => {
        // best-effort; ignore failures
      })
  }, [annonceId])

  return null
}

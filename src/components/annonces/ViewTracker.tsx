"use client"

import { useEffect } from "react"

import { trackAdEvent } from "@/lib/track-ad-event"

type Props = {
  annonceId: string
}

/**
 * Fires a single POST to /api/annonces/[id]/view after mount.
 * Uses sessionStorage to skip refresh-spam within the same browser session,
 * and the server still applies an IP-based dedup window.
 *
 * Also emits a granular `view` event to /api/annonces/[id]/track for the Pro
 * advanced stats (its own 30-min server dedup + owner exclusion) — the legacy
 * counter above stays exactly as it was.
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
    trackAdEvent(annonceId, "view")
  }, [annonceId])

  return null
}

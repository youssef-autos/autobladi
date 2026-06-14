"use client"

import { useEffect, useRef } from "react"

type Props = {
  adId: string
  /** Click destination — falls back to a non-interactive wrapper when null. */
  href: string | null
  /** Used as `aria-label` for screen readers. */
  title: string
  className?: string
  children: React.ReactNode
}

/**
 * Client wrapper that fires an impression beacon on mount and a click beacon
 * on user click. Both are best-effort: failures don't block navigation.
 *
 * Impressions are deduped per (ad, tab) on the client via a ref. Server-side
 * dedup (per IP, 10-minute window) lives in the API route.
 */
export function AdLink({ adId, href, title, className, children }: Props) {
  const recordedRef = useRef(false)

  useEffect(() => {
    if (recordedRef.current) return
    recordedRef.current = true
    // `keepalive` lets the request finish even if the user immediately
    // navigates away. We intentionally swallow errors — beacons are advisory.
    fetch(`/api/ads/${adId}/impression`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {})
  }, [adId])

  function handleClick() {
    fetch(`/api/ads/${adId}/click`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {})
  }

  if (!href) {
    return <div className={className}>{children}</div>
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={title}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}

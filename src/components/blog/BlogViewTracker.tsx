"use client"

import { useEffect, useRef } from "react"

type Props = {
  postId: string
}

/**
 * Fires a once-per-mount POST to the view counter API. The API itself
 * dedupes per (post, ip) within a 10-min window so back/forward navigation
 * doesn't inflate the counter.
 */
export function BlogViewTracker({ postId }: Props) {
  const firedRef = useRef(false)
  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    fetch(`/api/blog/${postId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {})
  }, [postId])
  return null
}

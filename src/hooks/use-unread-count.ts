"use client"

import { useEffect, useRef, useState } from "react"

import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"

type Options = {
  initial?: number
  onNewMessage?: (payload: {
    id: string
    sender_id: string
    content: string
    conversation_id: string | null
    annonce_id: string | null
  }) => void
}

/**
 * Tracks the current user's unread incoming-message count and keeps it in sync
 * via Realtime. Optionally invokes `onNewMessage` for toast notifications.
 *
 * Refetches the count on UPDATE events (read-receipt flips) rather than trying
 * to track state diffs from payload alone — payload may not include the old
 * row for non-FULL replica identities.
 */
export function useUnreadCount({ initial = 0, onNewMessage }: Options = {}): number {
  const [count, setCount] = useState(initial)
  const { user } = useUser()
  const userId = user?.id ?? null
  const callbackRef = useRef(onNewMessage)

  // Sync latest callback without triggering re-subscribes
  useEffect(() => {
    callbackRef.current = onNewMessage
  })

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    let cancelled = false

    async function refresh() {
      if (!userId) return
      const { count: c } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("is_read", false)
      if (!cancelled) setCount(c ?? 0)
    }

    refresh()

    const channel = supabase
      .channel(`user-messages:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const m = payload.new as {
            id: string
            sender_id: string
            content: string
            conversation_id: string | null
            annonce_id: string | null
            is_read: boolean
          }
          if (!m.is_read) setCount((c) => c + 1)
          callbackRef.current?.({
            id: m.id,
            sender_id: m.sender_id,
            content: m.content,
            conversation_id: m.conversation_id,
            annonce_id: m.annonce_id,
          })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          // Refetch on any update (read-flip is the only common reason)
          refresh()
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [userId])

  return count
}

"use client"

import { useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"

export type RealtimeMessage = {
  id: string
  conversation_id: string | null
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  annonce_id: string | null
}

/**
 * Loads the existing messages for a conversation and keeps the list in sync
 * via Supabase Realtime (INSERT for new, UPDATE for read receipts).
 *
 * Returns `null` while loading, [] when empty.
 */
export function useRealtimeMessages(
  conversationId: string | null,
): RealtimeMessage[] | null {
  const [messages, setMessages] = useState<RealtimeMessage[] | null>(null)
  // "Storing information from previous renders" pattern (React docs):
  // resets `messages` synchronously when `conversationId` changes — no effect,
  // no extra commit.
  const [seenConversationId, setSeenConversationId] = useState<string | null>(
    conversationId,
  )
  if (seenConversationId !== conversationId) {
    setSeenConversationId(conversationId)
    setMessages(null)
  }

  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()
    let cancelled = false

    // Initial load
    supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_id, receiver_id, content, is_read, created_at, annonce_id",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        setMessages((data ?? []) as unknown as RealtimeMessage[])
      })

    // Realtime channel scoped to this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as RealtimeMessage
          setMessages((prev) => {
            if (!prev) return [incoming]
            if (prev.some((m) => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as RealtimeMessage
          setMessages((prev) =>
            prev ? prev.map((m) => (m.id === updated.id ? updated : m)) : prev,
          )
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [conversationId])

  return messages
}

"use client"

import { useState } from "react"

import { ChatWindow } from "@/components/messages/ChatWindow"
import { ConversationsList } from "@/components/messages/ConversationsList"
import type { ConversationSummary } from "@/lib/queries/messages"
import { cn } from "@/lib/utils"

type Props = {
  conversations: ConversationSummary[]
  currentUserId: string
  initialConversationId?: string | null
}

export function MessagesPanel({
  conversations,
  currentUserId,
  initialConversationId = null,
}: Props) {
  const firstId = initialConversationId ?? conversations[0]?.id ?? null
  const [selectedId, setSelectedId] = useState<string | null>(firstId)

  // Pure derivation: if the selected id is gone (deleted, filtered out),
  // fall back to the first available conversation. No effect, no extra render.
  const selectedExists =
    selectedId !== null && conversations.some((c) => c.id === selectedId)
  const effectiveSelectedId = selectedExists
    ? selectedId
    : (conversations[0]?.id ?? null)
  const selected =
    conversations.find((c) => c.id === effectiveSelectedId) ?? null

  return (
    <div className="h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh)] grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[340px_1fr] bg-white">
      {/* List — hidden on mobile when a conversation is open */}
      <aside
        className={cn(
          "border-e border-border min-h-0",
          selected ? "hidden md:flex md:flex-col" : "flex flex-col",
        )}
      >
        <ConversationsList
          conversations={conversations}
          selectedId={effectiveSelectedId}
          currentUserId={currentUserId}
          onSelect={setSelectedId}
        />
      </aside>

      {/* Chat — full-screen on mobile when opened */}
      <section
        className={cn(
          "min-h-0 flex flex-col",
          selected ? "flex" : "hidden md:flex",
        )}
      >
        <ChatWindow
          conversation={selected}
          currentUserId={currentUserId}
          onBack={() => setSelectedId(null)}
        />
      </section>
    </div>
  )
}

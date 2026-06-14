"use client"

import { useEffect, useRef, useTransition } from "react"
import Image from "next/image"
import { ArrowLeft, Camera, MessageCircle, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { markConversationRead } from "@/app/[locale]/dashboard/messages/actions"
import { Link } from "@/i18n/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageBubble } from "@/components/messages/MessageBubble"
import { MessageInput } from "@/components/messages/MessageInput"
import { PriceTag } from "@/components/ui/PriceTag"
import { useRealtimeMessages } from "@/hooks/use-realtime-messages"
import type { ConversationSummary } from "@/lib/queries/messages"
import { cn } from "@/lib/utils"

type Props = {
  conversation: ConversationSummary | null
  currentUserId: string
  onBack?: () => void
}

const GROUPING_WINDOW_MS = 2 * 60 * 1000 // 2 minutes

function initials(name?: string | null): string {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function ChatWindow({ conversation, currentUserId, onBack }: Props) {
  const t = useTranslations("messagesPage")
  const messages = useRealtimeMessages(conversation?.id ?? null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [, startTransition] = useTransition()

  // Mark unread incoming messages as read when opening / when new arrive
  useEffect(() => {
    if (!conversation) return
    if (!messages) return
    const hasUnread = messages.some(
      (m) => m.receiver_id === currentUserId && !m.is_read,
    )
    if (!hasUnread) return
    startTransition(async () => {
      await markConversationRead(conversation.id)
    })
  }, [conversation, messages, currentUserId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-3">
        <span className="inline-flex items-center justify-center size-14 rounded-2xl bg-moroccan-sand-50 text-moroccan-red-500">
          <MessageCircle className="size-6" aria-hidden="true" />
        </span>
        <h3 className="font-semibold text-foreground">{t("chat.selectConversation")}</h3>
        <p className="text-sm max-w-xs">{t("chat.selectDesc")}</p>
      </div>
    )
  }

  const other = conversation.other_user
  const annonce = conversation.annonce
  const isPro =
    other.account_type === "pro" || other.account_type === "admin"

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-white">
      {/* Header */}
      <header className="border-b border-border bg-background px-3 md:px-5 py-3 flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t("chat.back")}
            className="md:hidden inline-flex items-center justify-center size-9 rounded-lg text-foreground hover:bg-moroccan-sand-50 -ms-2"
          >
            <ArrowLeft className="size-4 rtl:scale-x-[-1]" aria-hidden="true" />
          </button>
        )}
        <Avatar className="size-10">
          {other.avatar_url && <AvatarImage src={other.avatar_url} alt={other.full_name ?? ""} />}
          <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-sm font-semibold">
            {initials(other.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {other.full_name ?? "—"}
          </p>
          <div className="flex flex-wrap items-center gap-1 mt-0.5">
            {isPro && <Badge variant="pro" className="text-[10px]">Pro</Badge>}
            {other.is_verified && (
              <Badge variant="verified" className="text-[10px] gap-1">
                <ShieldCheck className="size-3" aria-hidden="true" />
                ✓
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Annonce reference */}
      {annonce && (
        <Link
          href={`/annonces/${annonce.slug}`}
          className="flex items-center gap-3 mx-3 md:mx-5 mt-3 rounded-xl border border-border bg-moroccan-sand-50/60 p-2.5 hover:bg-moroccan-sand-50 transition-colors"
        >
          <div className="relative size-12 rounded-lg bg-moroccan-sand-50 overflow-hidden shrink-0">
            {annonce.main_image ? (
              <Image
                src={annonce.main_image}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-moroccan-sand-200">
                <Camera className="size-4" strokeWidth={1.2} aria-hidden="true" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase text-muted-foreground font-medium tracking-wide">
              {t("annonceRef")}
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {annonce.title}
            </p>
          </div>
          <PriceTag price={annonce.price} size="sm" className="shrink-0" />
        </Link>
      )}

      {/* Messages scroll */}
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto px-3 md:px-5 py-4 space-y-2 flex flex-col bg-moroccan-sand-50/30",
        )}
      >
        {messages == null && (
          <div className="my-auto text-center text-sm text-muted-foreground">…</div>
        )}
        {messages?.map((msg, idx) => {
          const prev = idx > 0 ? messages[idx - 1] : null
          const next = idx < messages.length - 1 ? messages[idx + 1] : null
          const isFromMe = msg.sender_id === currentUserId
          const sameSenderPrev = prev?.sender_id === msg.sender_id
          const sameSenderNext = next?.sender_id === msg.sender_id
          const withinPrevWindow =
            prev != null &&
            new Date(msg.created_at).getTime() -
              new Date(prev.created_at).getTime() <
              GROUPING_WINDOW_MS
          const withinNextWindow =
            next != null &&
            new Date(next.created_at).getTime() -
              new Date(msg.created_at).getTime() <
              GROUPING_WINDOW_MS

          const isFirstInGroup = !sameSenderPrev || !withinPrevWindow
          const isLastInGroup = !sameSenderNext || !withinNextWindow

          return (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              createdAt={msg.created_at}
              isFromMe={isFromMe}
              isRead={msg.is_read}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
              showTimestamp={isLastInGroup}
            />
          )
        })}
      </div>

      <MessageInput conversationId={conversation.id} />
    </div>
  )
}

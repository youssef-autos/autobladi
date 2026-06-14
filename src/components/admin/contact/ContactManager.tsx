"use client"

import { useMemo, useState, useTransition } from "react"
import {
  Check,
  Mail,
  MailOpen,
  MessagesSquare,
  Phone,
  Reply,
} from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"

import { markContactRead } from "@/app/[locale]/admin/contact/actions"
import { EmptyState } from "@/components/ui/EmptyState"
import type { AdminContactMessage } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"

type Props = {
  messages: AdminContactMessage[]
}

type Filter = "all" | "unread" | "read"

const FILTERS: Filter[] = ["all", "unread", "read"]

function initials(name?: string | null): string {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function ContactManager({ messages }: Props) {
  const t = useTranslations("adminPanel.contactPage")
  const format = useFormatter()
  const [filter, setFilter] = useState<Filter>("all")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const counts = useMemo(() => {
    const unread = messages.filter((m) => !m.is_read).length
    return { all: messages.length, unread, read: messages.length - unread }
  }, [messages])

  const filtered = useMemo(() => {
    if (filter === "unread") return messages.filter((m) => !m.is_read)
    if (filter === "read") return messages.filter((m) => m.is_read)
    return messages
  }, [messages, filter])

  function onToggleRead(msg: AdminContactMessage) {
    setPendingId(msg.id)
    startTransition(async () => {
      const res = await markContactRead({ id: msg.id, is_read: !msg.is_read })
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(msg.is_read ? t("toast.markedUnread") : t("toast.markedRead"))
    })
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => {
          const isActive = filter === f
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm font-medium transition-colors",
                isActive
                  ? "border-moroccan-red-500/40 bg-moroccan-red-50 text-moroccan-red-600"
                  : "border-border bg-card text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground",
              )}
            >
              {t(`tabs.${f}`)}
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] tabular-nums",
                  isActive
                    ? "bg-moroccan-red-500 text-white"
                    : "bg-moroccan-sand-100 text-muted-foreground",
                )}
              >
                {counts[f]}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {messages.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={MessagesSquare}
            title={t("empty")}
            description={t("emptyDesc")}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-8 shadow-card text-center text-sm text-muted-foreground">
          {t("noResults")}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((msg) => {
            const replySubject = msg.subject ? `Re: ${msg.subject}` : "Re:"
            const mailto = `mailto:${msg.email}?subject=${encodeURIComponent(replySubject)}`
            return (
              <li
                key={msg.id}
                className={cn(
                  "rounded-2xl border bg-card p-5 shadow-card transition-colors",
                  msg.is_read
                    ? "border-border"
                    : "border-moroccan-red-500/30 bg-moroccan-red-50/30",
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <span className="inline-flex size-11 items-center justify-center rounded-full bg-moroccan-sand-50 text-moroccan-red-500 text-sm font-semibold">
                      {initials(msg.name)}
                    </span>
                    {!msg.is_read && (
                      <span className="absolute -top-0.5 -end-0.5 size-3 rounded-full bg-moroccan-red-500 ring-2 ring-card" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {msg.name}
                        </p>
                        <div className="flex items-center gap-x-4 gap-y-0.5 flex-wrap text-xs text-muted-foreground mt-0.5">
                          <a
                            href={mailto}
                            className="inline-flex items-center gap-1 hover:text-moroccan-red-600"
                          >
                            <Mail className="size-3.5" aria-hidden="true" />
                            {msg.email}
                          </a>
                          {msg.phone && (
                            <a
                              href={`tel:${msg.phone}`}
                              className="inline-flex items-center gap-1 hover:text-foreground"
                            >
                              <Phone className="size-3.5" aria-hidden="true" />
                              {msg.phone}
                            </a>
                          )}
                        </div>
                      </div>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {format.dateTime(new Date(msg.created_at), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>

                    {msg.subject && (
                      <p className="mt-3 text-sm font-medium text-foreground">
                        {msg.subject}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </p>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <a
                        href={mailto}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-moroccan-gradient text-white text-sm font-medium shadow-moroccan hover:brightness-105"
                      >
                        <Reply className="size-4" aria-hidden="true" />
                        {t("reply")}
                      </a>
                      <button
                        type="button"
                        onClick={() => onToggleRead(msg)}
                        disabled={pendingId === msg.id}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-moroccan-sand-50 disabled:opacity-50"
                      >
                        {msg.is_read ? (
                          <>
                            <Mail className="size-4" aria-hidden="true" />
                            {t("markUnread")}
                          </>
                        ) : (
                          <>
                            <MailOpen className="size-4" aria-hidden="true" />
                            {t("markRead")}
                          </>
                        )}
                      </button>
                      {msg.is_read && (
                        <span className="inline-flex items-center gap-1 text-xs text-moroccan-mint-500">
                          <Check className="size-3.5" aria-hidden="true" />
                          {t("readState")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

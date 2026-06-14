"use client"

import { useMemo, useState } from "react"
import { MessageCircle, Search } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { ConversationSummary } from "@/lib/queries/messages"
import { cn } from "@/lib/utils"

type Props = {
  conversations: ConversationSummary[]
  selectedId: string | null
  currentUserId: string
  onSelect: (id: string) => void
}

function initials(name?: string | null): string {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function ConversationsList({
  conversations,
  selectedId,
  currentUserId,
  onSelect,
}: Props) {
  const t = useTranslations("messagesPage")
  const format = useFormatter()
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => {
      const name = c.other_user.full_name?.toLowerCase() ?? ""
      const last = c.last_message?.content.toLowerCase() ?? ""
      const annonce = c.annonce?.title.toLowerCase() ?? ""
      return name.includes(q) || last.includes(q) || annonce.includes(q)
    })
  }, [conversations, query])

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 border-b border-border space-y-3">
        <h2 className="font-semibold text-foreground">{t("title")}</h2>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            className="w-full h-10 rounded-xl bg-moroccan-sand-50 border border-transparent ps-9 pe-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-moroccan-red-500/30"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-moroccan-sand-50 text-moroccan-red-500">
              <MessageCircle className="size-5" aria-hidden="true" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">{t("list.empty")}</h3>
            <p className="text-xs text-muted-foreground">{t("list.emptyDesc")}</p>
            <Link
              href="/annonces"
              className="inline-flex items-center h-9 px-3 text-xs font-medium text-moroccan-red-500 hover:underline"
            >
              {t("list.browse")} →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((c) => {
              const isActive = c.id === selectedId
              const isFromMe = c.last_message?.sender_id === currentUserId
              const isPro =
                c.other_user.account_type === "pro" ||
                c.other_user.account_type === "admin"
              const lastTime = format.relativeTime(
                new Date(c.last_message_at),
                new Date(),
              )

              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      "w-full text-start px-4 py-3 flex items-start gap-3 transition-colors",
                      isActive
                        ? "bg-moroccan-red-50/60"
                        : "hover:bg-moroccan-sand-50",
                    )}
                  >
                    <Avatar className="size-11 shrink-0">
                      {c.other_user.avatar_url && (
                        <AvatarImage
                          src={c.other_user.avatar_url}
                          alt={c.other_user.full_name ?? ""}
                        />
                      )}
                      <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-sm font-semibold">
                        {initials(c.other_user.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {c.other_user.full_name ?? "—"}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {lastTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isPro && (
                          <Badge variant="pro" className="text-[9px] px-1 h-4">
                            Pro
                          </Badge>
                        )}
                        {c.annonce && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {c.annonce.title}
                          </p>
                        )}
                      </div>
                      {c.last_message && (
                        <p
                          className={cn(
                            "text-xs mt-1 truncate",
                            c.unread_count > 0 && !isFromMe
                              ? "text-foreground font-medium"
                              : "text-muted-foreground",
                          )}
                        >
                          {isFromMe && `${t("you")}: `}
                          {c.last_message.content}
                        </p>
                      )}
                    </div>

                    {c.unread_count > 0 && !isFromMe && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-moroccan-red-500 text-white text-[10px] font-bold shrink-0">
                        {c.unread_count}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

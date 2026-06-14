"use client"

import { Bell } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Link } from "@/i18n/navigation"
import { useUser } from "@/hooks/use-user"
import { useUnreadCount } from "@/hooks/use-unread-count"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
}

export function NotificationBell({ className }: Props) {
  const tNav = useTranslations("nav")
  const t = useTranslations("messagesPage")
  const { user, loading } = useUser()

  const count = useUnreadCount({
    onNewMessage: (m) => {
      const preview = m.content.length > 60 ? m.content.slice(0, 57) + "…" : m.content
      toast.info(t("newMessage", { name: tNav("messages"), content: preview }), {
        action: {
          label: tNav("messages"),
          onClick: () => {
            window.location.href = `/dashboard/messages`
          },
        },
      })
    },
  })

  if (loading || !user) return null

  return (
    <Link
      href="/dashboard/messages"
      aria-label={tNav("messages")}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-red-500 transition-colors",
        className,
      )}
    >
      <Bell className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 end-0.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-moroccan-red-500 text-white text-[10px] font-bold ring-2 ring-background tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}

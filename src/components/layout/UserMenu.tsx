"use client"

import { User } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

type Props = {
  /** Unread message count (passed by caller; layout doesn't fetch) */
  unreadMessages?: number
  className?: string
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

export function UserMenu({ unreadMessages = 0, className }: Props) {
  const t = useTranslations("userMenu")
  const { user, profile, loading } = useUser()

  if (loading) {
    return <div className={cn("size-9 rounded-full bg-muted animate-pulse", className)} />
  }

  // Logged out: the account icon goes straight to the login page.
  if (!user) {
    return (
      <Link
        href="/auth/connexion"
        aria-label={t("account")}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-full bg-moroccan-sand-50 text-moroccan-red-500 transition-colors hover:bg-moroccan-sand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moroccan-red-500/30",
          className,
        )}
      >
        <User className="size-5" />
      </Link>
    )
  }

  const name = profile?.full_name ?? user.email ?? ""

  // Logged in: the avatar links straight to the dashboard (full menu +
  // sign-out live in the dashboard sidebar).
  return (
    <Link
      href="/dashboard"
      aria-label={t("dashboard")}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moroccan-red-500/30",
        className,
      )}
    >
      <Avatar className="size-9">
        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />}
        <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-sm font-semibold">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {unreadMessages > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -end-0.5 size-2.5 rounded-full bg-moroccan-red-500 ring-2 ring-background"
        />
      )}
    </Link>
  )
}

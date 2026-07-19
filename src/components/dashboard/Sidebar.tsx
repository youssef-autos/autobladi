"use client"

import { useState, useTransition } from "react"
import {
  Crown,
  ExternalLink,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  Store,
  Tag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { signOut } from "@/app/[locale]/auth/actions"
import { Link, usePathname } from "@/i18n/navigation"
import { Logo } from "@/components/layout/Logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { DashboardProfile } from "@/lib/queries/dashboard"
import { cn } from "@/lib/utils"

type Props = {
  profile: DashboardProfile | null
  email: string | null
  unreadMessages: number
  logoUrl?: string | null
}

type Item = {
  href: string
  label: string
  icon: LucideIcon
  badge?: string | number
  highlight?: boolean
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

export function DashboardSidebar({ profile, email, unreadMessages, logoUrl }: Props) {
  const tNav = useTranslations("dashboard.nav")
  const tBadge = useTranslations("dashboard.badge")
  const tMenu = useTranslations("dashboard")
  const locale = useLocale()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const accountType = profile?.account_type ?? "gratuit"

  const items: Item[] = [
    { href: "/dashboard", label: tNav("home"), icon: LayoutDashboard },
    { href: "/dashboard/annonces", label: tNav("annonces"), icon: Tag },
    { href: "/dashboard/ajouter", label: tNav("ajouter"), icon: TrendingUp },
    { href: "/dashboard/favoris", label: tNav("favoris"), icon: Heart },
    {
      href: "/dashboard/messages",
      label: tNav("messages"),
      icon: Mail,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    { href: "/dashboard/compte", label: tNav("compte"), icon: Settings },
  ]

  if (accountType === "gratuit") {
    // Free activation of a professional account lives on the showroom page.
    items.push({
      href: "/dashboard/showroom",
      label: tNav("upgrade"),
      icon: Store,
      highlight: true,
    })
  }

  if (accountType === "pro" || accountType === "admin") {
    items.push({ href: "/dashboard/showroom", label: tNav("showroom"), icon: Store })
  }

  // Admin-only shortcut: jump from the user dashboard straight to /admin.
  // Prepend so it sits at the top of the sidebar where it's hard to miss.
  if (accountType === "admin") {
    items.unshift({
      href: "/admin",
      label: tNav("adminPanel"),
      icon: Crown,
      highlight: true,
    })
  }

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border">
        <Logo size="md" imageUrl={logoUrl} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-moroccan-red-50 text-moroccan-red-600"
                      : "text-foreground/80 hover:bg-moroccan-sand-50 hover:text-foreground",
                    item.highlight && !isActive &&
                      "bg-moroccan-gold-50 text-moroccan-gold-700 hover:bg-moroccan-gold-100",
                  )}
                >
                  <span className="inline-flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isActive
                          ? "text-moroccan-red-500"
                          : item.highlight
                            ? "text-moroccan-gold-600"
                            : "text-muted-foreground group-hover:text-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <Badge variant="pro" className="text-[10px] h-5 min-w-5 px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <Separator className="my-4" />

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          {tNav("viewSite")}
        </Link>
      </nav>

      <footer className="border-t border-border p-4 space-y-3">
        <Link
          href="/dashboard/compte"
          className="flex items-center gap-3 rounded-xl hover:bg-moroccan-sand-50 px-2 py-1.5 transition-colors"
        >
          <Avatar className="size-10">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />
            )}
            <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 font-semibold text-sm">
              {initials(profile?.full_name ?? email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.full_name ?? email ?? ""}
            </p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {accountType === "gratuit" && (
                <Badge variant="outline" className="text-[10px]">
                  {tBadge("gratuit")}
                </Badge>
              )}
              {accountType === "pro" && (
                <Badge variant="pro" className="text-[10px]">
                  {tBadge("pro")}
                </Badge>
              )}
              {accountType === "admin" && (
                <Badge variant="featured" className="text-[10px]">
                  {tBadge("admin")}
                </Badge>
              )}
            </div>
          </div>
        </Link>

        <SignOutButton locale={locale} label={tNav("signOut")} />
      </footer>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 z-30 w-64 bg-background border-e border-border start-0 flex-col">
        {content}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border h-14 flex items-center px-4 gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label={tMenu("openSidebar")}
            className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-moroccan-sand-50"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent
            side={locale === "ar" ? "right" : "left"}
            className="w-72 p-0 flex flex-col gap-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{tMenu("menu")}</SheetTitle>
            </SheetHeader>
            {content}
          </SheetContent>
        </Sheet>
        <Logo size="sm" imageUrl={logoUrl} />
      </div>
    </>
  )
}

function SignOutButton({ locale, label }: { locale: string; label: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      onClick={() => startTransition(() => signOut(locale))}
      disabled={pending}
      className="inline-flex items-center gap-2 w-full rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
    >
      <LogOut className="size-4" aria-hidden="true" />
      {label}
    </button>
  )
}

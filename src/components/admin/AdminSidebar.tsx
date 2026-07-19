"use client"

import { useEffect, useState, useTransition } from "react"
import {
  BarChart3,
  Building2,
  Car,
  ChevronDown,
  Clock,
  Cog,
  ExternalLink,
  FileText,
  Flag,
  KeyRound,
  Layers,
  LayoutDashboard,
  Layout as LayoutIcon,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessagesSquare,
  Newspaper,
  Search,
  Send,
  Sparkles,
  Star,
  Tag,
  Users as UsersIcon,
  type LucideIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { signOut } from "@/app/[locale]/auth/actions"
import { CacheClearButton } from "@/components/admin/CacheClearButton"
import { Link, usePathname } from "@/i18n/navigation"
import { Logo } from "@/components/layout/Logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type Item = { href: string; labelKey: string; icon: LucideIcon; badge?: number }
type Group = { labelKey: string; items: Item[] }

type AdminProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

type Counts = {
  pendingAnnonces: number
  pendingReports: number
}

function initials(name?: string | null): string {
  if (!name) return "A"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

function isItemActive(href: string, pathname: string): boolean {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(`${href}/`)
}

function makeGroups(counts: Counts): Group[] {
  return [
    {
      labelKey: "manage",
      items: [
        { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
        { href: "/admin/brands", labelKey: "brands", icon: Tag },
        { href: "/admin/models", labelKey: "models", icon: Car },
        { href: "/admin/cities", labelKey: "cities", icon: MapPin },
      ],
    },
    {
      labelKey: "annonces",
      items: [
        { href: "/admin/annonces", labelKey: "allAnnonces", icon: Search },
        {
          href: "/admin/annonces/pending",
          labelKey: "pendingAnnonces",
          icon: Clock,
          badge: counts.pendingAnnonces,
        },
        {
          href: "/admin/annonces/featured",
          labelKey: "featuredAnnonces",
          icon: Sparkles,
        },
        {
          href: "/admin/reports",
          labelKey: "reports",
          icon: Flag,
          badge: counts.pendingReports,
        },
      ],
    },
    {
      labelKey: "professionnels",
      items: [
        {
          href: "/admin/professionnels",
          labelKey: "allProfessionnels",
          icon: Building2,
        },
        { href: "/admin/reviews", labelKey: "reviews", icon: Star },
      ],
    },
    {
      labelKey: "users",
      items: [{ href: "/admin/users", labelKey: "usersList", icon: UsersIcon }],
    },
    {
      labelKey: "communication",
      items: [
        { href: "/admin/contact", labelKey: "contact", icon: MessagesSquare },
        { href: "/admin/newsletter", labelKey: "newsletter", icon: Send },
      ],
    },
    {
      labelKey: "blog",
      items: [
        { href: "/admin/blog/categories", labelKey: "blogCategories", icon: Layers },
        { href: "/admin/blog", labelKey: "blogPosts", icon: Newspaper },
        { href: "/admin/blog/comments", labelKey: "blogComments", icon: MessagesSquare },
      ],
    },
    {
      labelKey: "ads",
      items: [
        { href: "/admin/ads/placements", labelKey: "adPlacements", icon: LayoutIcon },
        { href: "/admin/ads", labelKey: "ads", icon: Megaphone },
      ],
    },
    {
      labelKey: "sections",
      items: [
        { href: "/admin/sections", labelKey: "homeSections", icon: BarChart3 },
        { href: "/admin/pages", labelKey: "pages", icon: FileText },
      ],
    },
    {
      labelKey: "settings",
      items: [
        { href: "/admin/parametres", labelKey: "generalSettings", icon: Cog },
        { href: "/admin/settings/social-login", labelKey: "settingsSocial", icon: KeyRound },
        { href: "/admin/settings/email", labelKey: "settingsEmail", icon: Mail },
        { href: "/admin/settings/auth", labelKey: "settingsAuth", icon: Lock },
      ],
    },
  ]
}

type Props = {
  profile: AdminProfile
  counts: Counts
}

export function AdminSidebar({ profile, counts }: Props) {
  const t = useTranslations("adminPanel")
  const tNav = useTranslations("adminPanel.nav")
  const tGroups = useTranslations("adminPanel.groups")
  const pathname = usePathname()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const groups = makeGroups(counts)

  // Which group contains the current route — kept open by default.
  const activeKey =
    groups.find((g) => g.items.some((it) => isItemActive(it.href, pathname)))
      ?.labelKey ?? null

  // Collapsible groups: start with only the active group expanded.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    activeKey ? { [activeKey]: true } : {},
  )

  // Navigating into a different group auto-expands it (without collapsing
  // groups the admin opened manually).
  useEffect(() => {
    if (activeKey) {
      setOpenGroups((prev) =>
        prev[activeKey] ? prev : { ...prev, [activeKey]: true },
      )
    }
  }, [activeKey])

  const content = (
    <div className="flex flex-col h-full text-white">
      <header className="px-5 py-5 border-b border-white/10">
        <Logo size="md" variant="light" />
        <p className="mt-2 text-[10px] uppercase tracking-widest text-white/40">
          Admin panel
        </p>
      </header>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {groups.map((group) => {
          const isOpen = openGroups[group.labelKey] ?? false
          const hasActive = group.labelKey === activeKey
          const groupBadge = group.items.reduce(
            (sum, it) => sum + (it.badge ?? 0),
            0,
          )
          return (
            <section key={group.labelKey} className="mb-1.5 last:mb-0">
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((prev) => ({
                    ...prev,
                    [group.labelKey]: !isOpen,
                  }))
                }
                aria-expanded={isOpen}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] uppercase tracking-widest font-semibold transition-colors",
                  isOpen ? "text-white/70" : "text-white/40",
                  "hover:text-white/70 hover:bg-white/5",
                )}
              >
                <span className="flex-1 text-start truncate">
                  {tGroups(group.labelKey)}
                </span>
                {/* Collapsed signals: pending count + active-section dot */}
                {!isOpen && groupBadge > 0 && (
                  <Badge
                    variant="pro"
                    className="text-[10px] h-4 min-w-4 px-1 bg-moroccan-red-500 text-white border-0"
                  >
                    {groupBadge}
                  </Badge>
                )}
                {!isOpen && hasActive && (
                  <span
                    className="size-1.5 rounded-full bg-moroccan-gold-500"
                    aria-hidden="true"
                  />
                )}
                <ChevronDown
                  className={cn(
                    "size-3.5 shrink-0 transition-transform duration-200",
                    isOpen ? "rotate-180" : "rotate-0",
                  )}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <ul className="flex flex-col gap-0.5 mt-0.5 mb-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  {group.items.map((item) => {
                    const isActive = isItemActive(item.href, pathname)
                    const Icon = item.icon
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-white/10 text-white font-medium"
                              : "text-white/70 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <span className="inline-flex items-center gap-3 min-w-0">
                            <Icon
                              className={cn(
                                "size-4 shrink-0",
                                isActive
                                  ? "text-moroccan-gold-500"
                                  : "text-white/50",
                              )}
                              aria-hidden="true"
                            />
                            <span className="truncate">{tNav(item.labelKey)}</span>
                          </span>
                          {item.badge != null && item.badge > 0 && (
                            <Badge
                              variant="pro"
                              className="text-[10px] h-5 min-w-5 px-1.5 bg-moroccan-red-500 text-white border-0"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </nav>

      <footer className="border-t border-white/10 p-4 space-y-2">
        <Link
          href="/admin/compte"
          onClick={() => setOpen(false)}
          title={t("editProfile")}
          className={cn(
            "flex items-center gap-3 rounded-lg p-2 -m-2 transition-colors",
            pathname === "/admin/compte"
              ? "bg-white/10"
              : "hover:bg-white/5",
          )}
        >
          <Avatar className="size-9">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />
            )}
            <AvatarFallback className="bg-white/10 text-white text-sm font-semibold">
              {initials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">
              {profile.full_name ?? "Admin"}
            </p>
            <p className="text-[10px] text-moroccan-gold-500/80 uppercase tracking-widest">
              {t("editProfile")}
            </p>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 w-full rounded-lg px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          {t("viewSite")}
        </Link>

        <CacheClearButton />

        <SignOutItem locale={locale} label={t("signOut")} />
      </footer>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex fixed top-0 bottom-0 z-30 w-72 bg-brand-dark start-0 flex-col">
        {content}
      </aside>

      <div className="lg:hidden sticky top-0 z-30 bg-brand-dark/95 backdrop-blur border-b border-white/10 h-14 flex items-center px-4 gap-3 text-white">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label={t("openMenu")}
            className="inline-flex items-center justify-center rounded-lg p-2 text-white hover:bg-white/10"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent
            side={locale === "ar" ? "right" : "left"}
            className="w-80 p-0 flex flex-col gap-0 bg-brand-dark text-white border-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Admin</SheetTitle>
            </SheetHeader>
            {content}
          </SheetContent>
        </Sheet>
        <Logo size="sm" variant="light" />
      </div>
    </>
  )
}

function SignOutItem({ locale, label }: { locale: string; label: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      onClick={() => startTransition(() => signOut(locale))}
      disabled={pending}
      className="inline-flex items-center gap-2 w-full rounded-lg px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
    >
      <LogOut className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  )
}

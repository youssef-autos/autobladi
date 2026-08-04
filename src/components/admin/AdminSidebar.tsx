"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  Building2,
  Car,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
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
  Star,
  Tag,
  Users as UsersIcon,
  X,
  type LucideIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { signOut } from "@/app/[locale]/auth/actions"
import { CacheClearButton } from "@/components/admin/CacheClearButton"
import { Link, usePathname } from "@/i18n/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  pendingShowrooms: number
}

const COLLAPSE_KEY = "admin-sidebar-collapsed"
// Pill highlight used for the active nav item/group, everywhere.
const ACTIVE_PILL = "bg-moroccan-gradient text-white shadow-moroccan"

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

// The dashboard link is pinned above the groups (see PinnedDashboardLink),
// so it's intentionally not part of any group here.
function makeGroups(counts: Counts): Group[] {
  return [
    {
      labelKey: "manage",
      items: [
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
          href: "/admin/showrooms",
          labelKey: "allProfessionnels",
          icon: Building2,
          badge: counts.pendingShowrooms,
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
      items: [{ href: "/admin/pages", labelKey: "pages", icon: FileText }],
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
  /** Admin-uploaded logo (dark-background variant). Falls back to the text wordmark. */
  logoUrl?: string | null
}

export function AdminSidebar({ profile, counts, logoUrl }: Props) {
  const t = useTranslations("adminPanel")
  const tNav = useTranslations("adminPanel.nav")
  const tGroups = useTranslations("adminPanel.groups")
  const pathname = usePathname()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const groups = useMemo(() => makeGroups(counts), [counts])
  const totalPending =
    counts.pendingAnnonces + counts.pendingReports + counts.pendingShowrooms

  // Restore the admin's collapse preference (localStorage-only, so this
  // deliberately runs post-mount rather than during the initial render).
  useEffect(() => {
    try {
      // localStorage is unavailable during SSR; this corrects the SSR-safe
      // default (expanded) to the persisted preference right after mount.
      // No effect-free alternative exists for reading a browser-only API
      // without risking a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1")
    } catch {
      // Storage unavailable (private mode, etc.) — default expanded is fine.
    }
  }, [])

  // The desktop <main> reads this to know how much start-padding to reserve
  // — see [locale]/admin/layout.tsx's `lg:ps-(--admin-sidebar-w)`.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--admin-sidebar-w",
      collapsed ? "5rem" : "18rem",
    )
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0")
    } catch {
      // Non-fatal — just won't persist across reloads.
    }
  }, [collapsed])

  // Which group contains the current route — kept open by default.
  const activeKey =
    groups.find((g) => g.items.some((it) => isItemActive(it.href, pathname)))
      ?.labelKey ?? null

  // Collapsible groups: start with only the active group expanded.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    activeKey ? { [activeKey]: true } : {},
  )

  // Navigating into a different group auto-expands it (without collapsing
  // groups the admin opened manually) — adjusted during render rather than
  // in an effect (React's "adjusting state when a prop changes" pattern),
  // since activeKey is derivable identically on server and client and
  // doesn't need to wait for a post-mount effect.
  const [lastActiveKey, setLastActiveKey] = useState(activeKey)
  if (activeKey !== lastActiveKey) {
    setLastActiveKey(activeKey)
    if (activeKey && !openGroups[activeKey]) {
      setOpenGroups((prev) => ({ ...prev, [activeKey]: true }))
    }
  }

  // Flat, searchable index of every item with its resolved (translated)
  // label — lets the admin jump straight to any page by typing a few
  // letters instead of hunting through nine collapsible groups.
  const searchIndex = useMemo(
    () =>
      groups.flatMap((g) =>
        g.items.map((item) => ({
          ...item,
          label: tNav(item.labelKey),
          groupLabel: tGroups(g.labelKey),
        })),
      ),
    [groups, tNav, tGroups],
  )
  const trimmedQuery = query.trim().toLowerCase()
  const searchResults =
    trimmedQuery.length > 0
      ? searchIndex.filter((item) => item.label.toLowerCase().includes(trimmedQuery))
      : null

  // Full-width content — always used on mobile (the sheet), and on desktop
  // when the rail isn't collapsed.
  const expandedContent = (
    <div className="flex flex-col h-full text-white">
      <header className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-between gap-2">
          <BrandMark logoUrl={logoUrl} />
          <div className="flex items-center gap-1.5">
            {totalPending > 0 && (
              <Badge
                variant="pro"
                className="text-[10px] h-5 min-w-5 px-1.5 bg-moroccan-red-500 text-white border-0 shrink-0"
                title={t("pendingTotal", { count: totalPending })}
              >
                {totalPending}
              </Badge>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title={t("collapseSidebar")}
              aria-label={t("collapseSidebar")}
              className="hidden lg:inline-flex size-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ChevronsLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-white/40">
          Admin panel
        </p>
      </header>

      {/* Quick jump — filters every page across all groups as you type. */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search
            className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-white/40 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full h-9 ps-9 pe-8 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 outline-none focus:border-moroccan-gold-500/50 focus:bg-white/10 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("clearSearch")}
              className="absolute end-2 top-1/2 -translate-y-1/2 inline-flex size-5 items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/10"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {/* Dashboard is pinned — the most-visited page shouldn't hide behind
            a click to expand a group. Hidden while searching to keep focus
            on the filtered results. */}
        {!searchResults && (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className={cn(
              "mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isItemActive("/admin", pathname)
                ? ACTIVE_PILL
                : "text-white/80 hover:bg-white/5 hover:text-white",
            )}
          >
            <LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />
            {tNav("dashboard")}
          </Link>
        )}

        {searchResults ? (
          searchResults.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-white/40">
              {t("noSearchResults")}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {searchResults.map((item) => {
                const isActive = isItemActive(item.href, pathname)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                        isActive
                          ? ACTIVE_PILL + " font-medium"
                          : "text-white/70 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span className="inline-flex items-center gap-3 min-w-0">
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block truncate">{item.label}</span>
                          <span
                            className={cn(
                              "block text-[10px] truncate",
                              isActive ? "text-white/70" : "text-white/35",
                            )}
                          >
                            {item.groupLabel}
                          </span>
                        </span>
                      </span>
                      {item.badge != null && item.badge > 0 && (
                        <Badge
                          variant="pro"
                          className="text-[10px] h-5 min-w-5 px-1.5 bg-moroccan-red-500 text-white border-0 shrink-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )
        ) : (
          groups.map((group) => {
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
                    "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] uppercase tracking-widest font-semibold transition-colors",
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
                              "group flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                              isActive
                                ? ACTIVE_PILL + " font-medium"
                                : "text-white/70 hover:bg-white/5 hover:text-white",
                            )}
                          >
                            <span className="inline-flex items-center gap-3 min-w-0">
                              <Icon className="size-4 shrink-0" aria-hidden="true" />
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
          })
        )}
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

        <SignOutRow locale={locale} label={t("signOut")} />
      </footer>
    </div>
  )

  // Icon-only rail — desktop-only alternate view. Single-item groups link
  // straight through; multi-item groups open a flyout of their items.
  const collapsedContent = (
    <div className="flex flex-col h-full items-center text-white">
      <div className="w-full px-3 py-5 border-b border-white/10 flex flex-col items-center gap-3">
        <BrandMark compact logoUrl={logoUrl} />
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title={t("expandSidebar")}
          aria-label={t("expandSidebar")}
          className="inline-flex size-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ChevronsRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto w-full px-2.5 py-3 flex flex-col items-center gap-1.5">
        <RailLink
          href="/admin"
          icon={LayoutDashboard}
          label={tNav("dashboard")}
          active={isItemActive("/admin", pathname)}
        />

        {groups.map((group) => {
          const groupLabel = tGroups(group.labelKey)
          const groupBadge = group.items.reduce((sum, it) => sum + (it.badge ?? 0), 0)

          if (group.items.length === 1) {
            const item = group.items[0]!
            return (
              <RailLink
                key={group.labelKey}
                href={item.href}
                icon={item.icon}
                label={tNav(item.labelKey)}
                active={isItemActive(item.href, pathname)}
                badge={item.badge}
              />
            )
          }

          const hasActive = group.labelKey === activeKey
          const GroupIcon = group.items[0]!.icon

          return (
            <DropdownMenu key={group.labelKey}>
              <RailTrigger
                icon={GroupIcon}
                label={groupLabel}
                active={hasActive}
                badge={groupBadge}
              />
              <DropdownMenuContent side="inline-end" align="start" sideOffset={12} className="w-56">
                <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {groupLabel}
                </div>
                {group.items.map((item) => {
                  const isActive = isItemActive(item.href, pathname)
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem
                      key={item.href}
                      render={<Link href={item.href} />}
                      className={cn(isActive && "bg-moroccan-sand-50 font-medium")}
                    >
                      <Icon className="size-4 me-2" aria-hidden="true" />
                      {tNav(item.labelKey)}
                      {item.badge != null && item.badge > 0 && (
                        <Badge
                          variant="pro"
                          className="ms-auto text-[10px] h-5 min-w-5 px-1.5 bg-moroccan-red-500 text-white border-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        })}
      </nav>

      <div className="w-full border-t border-white/10 p-2.5 flex flex-col items-center gap-1.5">
        <Link
          href="/admin/compte"
          title={t("editProfile")}
          aria-label={t("editProfile")}
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-xl transition-colors",
            pathname === "/admin/compte" ? "bg-white/10" : "hover:bg-white/10",
          )}
        >
          <Avatar className="size-8">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />
            )}
            <AvatarFallback className="bg-white/10 text-white text-xs font-semibold">
              {initials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <Link
          href="/"
          title={t("viewSite")}
          aria-label={t("viewSite")}
          className="inline-flex size-11 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </Link>

        <SignOutRow locale={locale} label={t("signOut")} compact />
      </div>
    </div>
  )

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex fixed top-0 bottom-0 z-30 bg-brand-dark start-0 flex-col transition-[width] duration-200",
          collapsed ? "w-20" : "w-72",
        )}
      >
        {collapsed ? collapsedContent : expandedContent}
      </aside>

      <div className="lg:hidden sticky top-0 z-30 bg-brand-dark/95 backdrop-blur border-b border-white/10 h-14 flex items-center px-4 gap-3 text-white">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label={t("openMenu")}
            className="relative inline-flex items-center justify-center rounded-lg p-2 text-white hover:bg-white/10"
          >
            <Menu className="size-5" />
            {totalPending > 0 && (
              <span className="absolute top-0.5 end-0.5 size-2 rounded-full bg-moroccan-red-500 ring-2 ring-brand-dark" />
            )}
          </SheetTrigger>
          <SheetContent
            side={locale === "ar" ? "right" : "left"}
            className="w-80 p-0 flex flex-col gap-0 bg-brand-dark text-white border-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Admin</SheetTitle>
            </SheetHeader>
            {expandedContent}
          </SheetContent>
        </Sheet>
        <BrandMark logoUrl={logoUrl} />
      </div>
    </>
  )
}

/**
 * Brand mark — the admin-uploaded logo when set (dark-background variant),
 * otherwise the text wordmark. Full wordmark/image when expanded, a
 * single glyph or contained image when collapsed.
 */
function BrandMark({ compact, logoUrl }: { compact?: boolean; logoUrl?: string | null }) {
  if (compact) {
    if (logoUrl) {
      return (
        <Link href="/" aria-label="autobladi.ma" className="inline-flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="autobladi.ma" className="h-8 w-auto max-w-14 object-contain" />
        </Link>
      )
    }
    return (
      <Link
        href="/"
        aria-label="autobladi.ma"
        className="inline-flex size-9 items-center justify-center rounded-xl bg-moroccan-gradient font-display text-base font-bold text-white shadow-moroccan"
      >
        a
      </Link>
    )
  }

  if (logoUrl) {
    return (
      <Link href="/" aria-label="autobladi.ma" className="inline-flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="autobladi.ma" className="h-8 w-auto max-w-[170px] object-contain" />
      </Link>
    )
  }
  return (
    <Link
      href="/"
      aria-label="autobladi.ma"
      className="inline-flex items-baseline font-display text-xl font-bold tracking-tight text-white"
    >
      <span>autoblad</span>
      <span className="relative inline-block">
        <span>i</span>
        <span
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 -top-[0.05em] size-[0.22em] rounded-full bg-moroccan-gold-500"
        />
      </span>
      <span className="text-moroccan-gold-500">.ma</span>
    </Link>
  )
}

/** Single icon-only nav link for the collapsed rail. */
function RailLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: LucideIcon
  label: string
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-xl transition-colors",
        active ? ACTIVE_PILL : "text-white/60 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -end-0.5 inline-flex size-4 items-center justify-center rounded-full bg-moroccan-red-500 text-[9px] font-bold text-white ring-2 ring-brand-dark">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  )
}

/** Icon-only group trigger for the collapsed rail's flyout menus. */
function RailTrigger({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  badge: number
}) {
  return (
    <DropdownMenuTrigger
      title={label}
      aria-label={label}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-xl transition-colors",
        active ? ACTIVE_PILL : "text-white/60 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
      {badge > 0 && (
        <span className="absolute -top-0.5 -end-0.5 inline-flex size-4 items-center justify-center rounded-full bg-moroccan-red-500 text-[9px] font-bold text-white ring-2 ring-brand-dark">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </DropdownMenuTrigger>
  )
}

function SignOutRow({
  locale,
  label,
  compact,
}: {
  locale: string
  label: string
  compact?: boolean
}) {
  const [pending, startTransition] = useTransition()
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => startTransition(() => signOut(locale))}
        disabled={pending}
        title={label}
        aria-label={label}
        className="inline-flex size-11 items-center justify-center rounded-xl text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <LogOut className="size-4" aria-hidden="true" />
      </button>
    )
  }
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

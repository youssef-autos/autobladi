"use client"

import { useEffect, useState } from "react"
import { Heart, Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { Logo } from "@/components/layout/Logo"
import { MobileMenu } from "@/components/layout/MobileMenu"
import { NotificationBell } from "@/components/layout/NotificationBell"
import { SearchBar } from "@/components/layout/SearchBar"
import { UserMenu } from "@/components/layout/UserMenu"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

type HeaderProps = {
  /** Admin-uploaded logo for the active locale (null → text wordmark). */
  logoUrl?: string | null
}

export function Header({ logoUrl }: HeaderProps) {
  const t = useTranslations("nav")
  const { user, loading } = useUser()
  const [scrolled, setScrolled] = useState(false)

  // Logged-out visitors are sent to login when they tap a protected action
  // (favorites / publish). While auth is still loading we keep the real
  // target — the dashboard routes are guarded server-side anyway.
  const loggedOut = !loading && !user
  const favoritesHref = loggedOut ? "/auth/connexion" : "/dashboard/favoris"
  const publishHref = loggedOut ? "/auth/connexion" : "/dashboard/ajouter"

  useEffect(() => {
    // Hysteresis: collapse only past 110px and expand again below 30px.
    // The gap (> the ~60px the header shrinks by) prevents the collapse from
    // pushing scrollY back across a single threshold, which would otherwise
    // make the header oscillate ("flicker") around that point.
    let ticking = false
    const update = () => {
      ticking = false
      const y = window.scrollY
      setScrolled((prev) => {
        if (!prev && y > 110) return true
        if (prev && y < 30) return false
        return prev
      })
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-40">
      {/* Main bar */}
      <div
        className={cn(
          "bg-background border-b border-border transition-shadow duration-200",
          scrolled && "shadow-soft",
        )}
      >
        <div
          className={cn(
            "max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex items-center gap-4 transition-all duration-200",
            scrolled ? "h-14" : "h-20",
          )}
        >
          {/* Mobile menu trigger — start side */}
          <MobileMenu logoUrl={logoUrl} />

          <Logo size={scrolled ? "sm" : "md"} imageUrl={logoUrl} />

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ms-6">
            <NavLink href="/">{t("home")}</NavLink>
            <NavLink href="/annonces">{t("annonces")}</NavLink>
            <NavLink href="/professionnels">{t("professionnels")}</NavLink>
            <NavLink href="/estimation">{t("estimation")}</NavLink>
            <NavLink href="/comparer">{t("compare")}</NavLink>
            <NavLink href="/blog">{t("blog")}</NavLink>
            <NavLink href="/contact">{t("contact")}</NavLink>
          </nav>

          {/* Search — desktop only, takes remaining space */}
          <div className="hidden xl:block flex-1 max-w-xs ms-auto">
            <SearchBar />
          </div>

          {/* Actions — end side */}
          <div className="flex items-center gap-2 ms-auto xl:ms-3">
            <Link
              href={favoritesHref}
              aria-label={t("favorites")}
              className="hidden sm:inline-flex relative items-center justify-center rounded-lg p-2 text-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-red-500 transition-colors"
            >
              <Heart className="size-5" />
            </Link>

            <NotificationBell className="hidden sm:inline-flex" />

            <UserMenu />

            {/* Post-ad CTA — beside the account icon. Compact (icon-only) on
                mobile, full label from md up. On mobile it sits at the inline
                start (right of the account icon in RTL); desktop order is kept. */}
            <Link
              href={publishHref}
              className="order-first sm:order-none inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-moroccan-gradient h-9 px-3 sm:px-4 text-sm font-semibold text-white shadow-moroccan hover:brightness-105 transition-all"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("postAd")}</span>
            </Link>

            {/* Language switcher — beside the "post ad" button */}
            <LanguageSwitcher className="ms-1 shrink-0" />
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:text-moroccan-red-500 hover:bg-moroccan-sand-50 transition-colors"
    >
      {children}
    </Link>
  )
}

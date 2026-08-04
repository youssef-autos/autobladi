"use client"

import { useState } from "react"
import {
  Building2,
  Calculator,
  Car,
  GitCompare,
  Home,
  Menu,
  Newspaper,
  Phone,
  Tag,
  Heart,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { Logo } from "@/components/layout/Logo"
import { SearchBar } from "@/components/layout/SearchBar"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export function MobileMenu({
  className,
  logoUrl,
}: {
  className?: string
  logoUrl?: string | null
}) {
  const t = useTranslations("nav")
  const locale = useLocale() as "ar" | "fr"
  const [open, setOpen] = useState(false)
  const side = locale === "ar" ? "right" : "left"

  const items: NavItem[] = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/annonces", label: t("annonces"), icon: Car },
    { href: "/showrooms", label: t("showrooms"), icon: Building2 },
    { href: "/estimation", label: t("estimation"), icon: Calculator },
    { href: "/comparer", label: t("compare"), icon: GitCompare },
    { href: "/blog", label: t("blog"), icon: Newspaper },
    { href: "/contact", label: t("contact"), icon: Phone },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t("openMenu")}
        className={cn(
          "lg:hidden inline-flex items-center justify-center rounded-lg p-2.5 text-foreground hover:bg-muted transition-colors",
          className,
        )}
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent side={side} className="flex flex-col gap-0 p-0 w-[85vw] max-w-sm">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="sr-only">autobladi.ma</SheetTitle>
          <Logo size="md" imageUrl={logoUrl} />
        </SheetHeader>

        <div className="px-5 py-4">
          <SearchBar size="md" onSubmit={() => setOpen(false)} />
        </div>

        <Separator />

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="flex flex-col">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-foreground hover:bg-moroccan-sand-50 transition-colors"
                  >
                    <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <Separator className="my-2" />

          <ul className="flex flex-col">
            <li>
              <Link
                href="/dashboard/favorites"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-foreground hover:bg-moroccan-sand-50 transition-colors"
              >
                <Heart className="size-4 text-muted-foreground" aria-hidden="true" />
                {t("favorites")}
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/ajouter"
                onClick={() => setOpen(false)}
                className="mx-5 my-3 flex items-center justify-center gap-2 rounded-xl bg-moroccan-gradient px-4 h-11 text-sm font-semibold text-white shadow-moroccan hover:brightness-105 transition-all"
              >
                <Tag className="size-4" aria-hidden="true" />
                {t("postAd")}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-t border-border px-5 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>autobladi.ma</span>
          <LanguageSwitcher />
        </div>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { useTransition } from "react"
import { useLocale } from "next-intl"
import { useParams } from "next/navigation"

import { usePathname, useRouter } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  /** Use a lighter palette suitable for placement on the red top bar */
  variant?: "default" | "onRed"
}

// Arabic → Moroccan flag, French → France flag.
const LOCALE_FLAGS: Record<Locale, { src: string; label: string }> = {
  ar: { src: "/flags/ma.svg", label: "العربية" },
  fr: { src: "/flags/fr.svg", label: "Français" },
}

export function LanguageSwitcher({ className, variant = "default" }: Props) {
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()
  const [pending, startTransition] = useTransition()

  // Show a single flag — the *other* language (the one you'd switch to). This
  // keeps the header compact instead of rendering both flags side by side.
  const target: Locale = locale === "ar" ? "fr" : "ar"
  const flag = LOCALE_FLAGS[target]

  const switchTo = (next: Locale) => {
    if (next === locale || pending) return
    const search =
      typeof window !== "undefined"
        ? Object.fromEntries(new URLSearchParams(window.location.search).entries())
        : undefined
    startTransition(() => {
      router.replace(
        // @ts-expect-error — pathnames are dynamic; next-intl handles routing
        { pathname, params, query: search },
        { locale: next },
      )
    })
  }

  return (
    <button
      type="button"
      onClick={() => switchTo(target)}
      disabled={pending}
      aria-label={flag.label}
      title={flag.label}
      className={cn(
        "inline-flex items-center justify-center rounded-[3px] overflow-hidden transition-all hover:scale-105",
        variant === "onRed" ? "ring-1 ring-white/40" : "ring-1 ring-black/10",
        pending && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={flag.src}
        alt={flag.label}
        width={22}
        height={15}
        className="block h-[15px] w-[22px] object-cover"
      />
    </button>
  )
}

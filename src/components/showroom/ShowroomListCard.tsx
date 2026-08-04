"use client"

import Image from "next/image"
import { ArrowUpRight, Building2, Car, Check, MapPin } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  dealer: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    cover_url: string | null
    description?: string | null
    rating: number
    reviews_count: number
    annonces_count?: number
    is_pro?: boolean
    is_verified?: boolean
    city: { name_ar: string; name_fr: string } | null
  }
  className?: string
}

/**
 * Dealer card for the public directory (/showrooms): 3:1 cover with an
 * overlapping logo medallion, name + verified badge, city and listing count.
 */
export function ShowroomListCard({ dealer, className }: Props) {
  const locale = useLocale() as Locale
  const t = useTranslations("showrooms.list")
  const cityName = dealer.city
    ? locale === "ar"
      ? dealer.city.name_ar
      : dealer.city.name_fr
    : null
  const carsCount = dealer.annonces_count ?? 0

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-300",
        "hover:-translate-y-1 hover:border-moroccan-gold-500/40 hover:shadow-soft",
        className,
      )}
    >
      <Link
        href={`/showroom/${dealer.slug}`}
        className="absolute inset-0 z-10"
        aria-label={dealer.name}
      />

      {/* Cover */}
      <div className="relative aspect-[3/1] overflow-hidden bg-brand-dark">
        {dealer.cover_url ? (
          <Image
            src={dealer.cover_url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-moroccan-red-900/40 to-brand-dark" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/10"
          aria-hidden="true"
        />

        {/* Reveal-on-hover affordance — the whole card is already the link. */}
        <span
          className="absolute top-3 end-3 z-20 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 rtl:-scale-x-100"
          aria-hidden="true"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      {/* Logo medallion */}
      <div className="relative z-20 -mt-9 px-5">
        <div className="grid size-[68px] place-items-center overflow-hidden rounded-2xl border-4 border-card bg-card shadow-card">
          {dealer.logo_url ? (
            <Image
              src={dealer.logo_url}
              alt={dealer.name}
              width={68}
              height={68}
              className="size-full object-contain p-1"
            />
          ) : (
            <Building2
              className="size-7 text-moroccan-sand-200"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-3">
        <h3 className="flex items-center gap-1.5 min-w-0">
          <span className="line-clamp-1 font-display text-lg font-bold text-foreground">
            {dealer.name}
          </span>
          {dealer.is_verified && (
            <span
              title={t("verified")}
              className="inline-flex shrink-0 items-center justify-center size-4 rounded-full bg-blue-500 text-white"
            >
              <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
            </span>
          )}
        </h3>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {cityName && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-moroccan-gold-500" aria-hidden="true" />
              {cityName}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Car className="size-3.5 text-moroccan-gold-500" aria-hidden="true" />
            {t("carsCount", { count: carsCount })}
          </span>
        </div>
      </div>
    </article>
  )
}

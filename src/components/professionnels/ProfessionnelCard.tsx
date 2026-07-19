"use client"

import Image from "next/image"
import { ArrowUpRight, Building2, MapPin, Star } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import type { DealerCardData } from "@/lib/queries/home"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  dealer: DealerCardData
  className?: string
}

/**
 * Featured dealer card for the homepage "Top dealers" section. Mirrors the
 * public listing card: 3:1 cover, overlapping logo medallion, rating + cars
 * count, and a clear CTA.
 */
export function ProfessionnelCard({ dealer, className }: Props) {
  const locale = useLocale() as Locale
  const t = useTranslations("home.topDealers")
  const cityName = dealer.city
    ? locale === "ar"
      ? dealer.city.name_ar
      : dealer.city.name_fr
    : null

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-300",
        "hover:-translate-y-1 hover:border-moroccan-gold-500/40 hover:shadow-soft",
        className,
      )}
    >
      <Link
        href={`/professionnel/${dealer.slug}`}
        className="absolute inset-0 z-10"
        aria-label={dealer.name}
      />

      {/* Cover */}
      <div className="relative aspect-[3/1] overflow-hidden bg-moroccan-sand-100">
        {dealer.cover_url ? (
          <Image
            src={dealer.cover_url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-moroccan-sand-100 via-moroccan-gold-50 to-moroccan-sand-100" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-brand-dark/25 to-transparent"
          aria-hidden="true"
        />
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
      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-3">
        <div>
          <h3 className="line-clamp-1 font-display text-lg font-bold text-foreground">
            {dealer.name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {cityName && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 text-moroccan-gold-500" aria-hidden="true" />
                {cityName}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Star
                className="size-3.5 fill-moroccan-gold-500 text-moroccan-gold-500"
                aria-hidden="true"
              />
              <span className="font-semibold text-foreground">
                {Number(dealer.rating).toFixed(1)}
              </span>
              <span>({dealer.reviews_count})</span>
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <Badge variant="outline" className="text-xs">
            {t("carsCount", { count: dealer.annonces_count })}
          </Badge>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-moroccan-red-600 transition-colors group-hover:text-moroccan-red-500">
            {t("visit")}
            <ArrowUpRight
              className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </article>
  )
}

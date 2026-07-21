"use client"

import Image from "next/image"
import {
  CalendarDays,
  Camera,
  Cog,
  Fuel,
  Gauge,
  MapPin,
} from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { FavoriteButton } from "@/components/annonces/FavoriteButton"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/Card"
import { PriceTag } from "@/components/ui/PriceTag"
import { formatMileage } from "@/lib/utils/format"
import type { AnnonceCardData } from "@/lib/queries/home"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  annonce: AnnonceCardData
  className?: string
}

const fuelLabels: Record<string, { ar: string; fr: string }> = {
  essence: { ar: "بنزين", fr: "Essence" },
  diesel: { ar: "ديزل", fr: "Diesel" },
  hybrid: { ar: "هايبرد", fr: "Hybride" },
  electric: { ar: "كهربائي", fr: "Électrique" },
  lpg: { ar: "غاز", fr: "GPL" },
}

// Abbreviated for the compact card badge — full labels live in vehicle-options.ts
const transmissionShortLabels: Record<string, { ar: string; fr: string }> = {
  manuelle: { ar: "عادي", fr: "Manuelle" },
  automatique: { ar: "أوتوماتيك", fr: "Auto" },
}

export function AnnonceCardList({ annonce, className }: Props) {
  const locale = useLocale() as Locale
  const t = useTranslations("home.badges")
  const tDetail = useTranslations("annonceDetail")
  const format = useFormatter()

  const cityName = annonce.city
    ? locale === "ar"
      ? annonce.city.name_ar
      : annonce.city.name_fr
    : null

  const fuelLabel = annonce.fuel_type
    ? fuelLabels[annonce.fuel_type]?.[locale] ?? annonce.fuel_type
    : null

  const publishedRelative = annonce.published_at
    ? format.relativeTime(new Date(annonce.published_at), new Date())
    : null

  return (
    <Card
      as="article"
      padding="none"
      clip
      className={cn(
        "group relative flex flex-col sm:flex-row gap-0 sm:gap-5",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft",
        className,
      )}
    >
      <Link
        href={`/annonces/${annonce.slug}`}
        className="absolute inset-0 z-10"
        aria-label={annonce.title}
      />

      {/* Image */}
      <div className="relative sm:w-72 shrink-0 aspect-[4/3] sm:aspect-auto sm:min-h-[200px] bg-moroccan-sand-50 overflow-hidden">
        {annonce.main_image ? (
          <Image
            src={annonce.main_image}
            alt={annonce.title}
            fill
            sizes="(max-width: 640px) 100vw, 288px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-moroccan-sand-200">
            <Camera className="size-12" strokeWidth={1.2} aria-hidden="true" />
          </div>
        )}

        <div className="absolute top-3 start-3 flex flex-col items-start gap-1.5 z-20">
          {annonce.condition && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md",
                annonce.condition === "neuf"
                  ? "bg-moroccan-mint-500"
                  : "bg-moroccan-red-500",
              )}
            >
              {annonce.condition === "neuf"
                ? t("conditionNew")
                : t("conditionUsed")}
            </span>
          )}
        </div>

        {annonce.image_count > 1 && (
          <span className="absolute bottom-3 start-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Camera className="size-3" aria-hidden="true" />
            {annonce.image_count}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-5 gap-3">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-1">
              {annonce.title}
            </h3>
            {annonce.brand && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {annonce.brand.name}
                {annonce.model ? ` · ${annonce.model.name}` : ""}
              </p>
            )}
          </div>
          <FavoriteButton
            annonceId={annonce.id}
            variant="icon"
            className="size-9 shrink-0 bg-moroccan-sand-50 hover:bg-moroccan-red-50"
          />
        </header>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {annonce.year && (
            <li className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-moroccan-mint-500" aria-hidden="true" />
              {annonce.year}
            </li>
          )}
          {annonce.mileage != null && (
            <li className="inline-flex items-center gap-1.5">
              <Gauge className="size-3.5 text-moroccan-mint-500" aria-hidden="true" />
              {formatMileage(annonce.mileage, locale)}
            </li>
          )}
          {fuelLabel && (
            <li className="inline-flex items-center gap-1.5">
              <Fuel className="size-3.5 text-moroccan-mint-500" aria-hidden="true" />
              {fuelLabel}
            </li>
          )}
          {annonce.transmission && (
            <li className="inline-flex items-center gap-1.5 capitalize">
              <Cog className="size-3.5 text-moroccan-mint-500" aria-hidden="true" />
              {transmissionShortLabels[annonce.transmission]?.[locale] ?? annonce.transmission}
            </li>
          )}
          {cityName && (
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              {cityName}
            </li>
          )}
        </ul>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3 border-t border-border/60">
          <div className="flex items-center gap-2 flex-wrap">
            <PriceTag price={annonce.price} priceOnRequest={annonce.price_on_request} size="xl" />
            {annonce.negotiable && (
              <Badge variant="verified">{tDetail("negotiable")}</Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5 text-end">
            {annonce.seller_name && <p className="font-medium text-foreground">{annonce.seller_name}</p>}
            {publishedRelative && <p>{publishedRelative}</p>}
          </div>
        </div>
      </div>
    </Card>
  )
}
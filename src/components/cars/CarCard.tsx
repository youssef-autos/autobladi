"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import {
  Camera,
  CalendarDays,
  Cog,
  Fuel,
  Gauge,
  MapPin,
} from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { CompareButton } from "@/components/compare/CompareButton"
import { FavoriteButton } from "@/components/annonces/FavoriteButton"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/Card"
import { PriceTag } from "@/components/ui/PriceTag"
import { mediaUrl } from "@/lib/media"
import { formatMileage, formatPhone } from "@/lib/utils/format"
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

export function CarCard({ annonce, className }: Props) {
  const locale = useLocale() as Locale
  const t = useTranslations("home.badges")
  const tDetail = useTranslations("annonceDetail")
  const format = useFormatter()
  // formatPhone is imported but kept here for tree-shaking parity with list view
  void formatPhone

  const cityName = annonce.city
    ? locale === "ar"
      ? annonce.city.name_ar
      : annonce.city.name_fr
    : null

  const fuelLabel = annonce.fuel_type
    ? fuelLabels[annonce.fuel_type]?.[locale] ?? annonce.fuel_type
    : null

  // "Now" differs between the server-render instant and the client-hydration
  // instant, so computing relative time during render can make the server
  // and client text disagree (hydration mismatch). Default to null (matches
  // between both passes) and fill in the real value right after mount.
  const [publishedRelative, setPublishedRelative] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPublishedRelative(
      annonce.published_at
        ? format.relativeTime(new Date(annonce.published_at), new Date())
        : null,
    )
  }, [annonce.published_at, format])

  return (
    <Card
      as="article"
      padding="none"
      clip
      className={cn(
        "group relative flex flex-col",
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
      <div className="relative aspect-[4/3] bg-moroccan-sand-50 overflow-hidden">
        {annonce.main_image ? (
          <Image
            src={annonce.main_image}
            alt={annonce.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-moroccan-sand-200">
            <Camera className="size-10" strokeWidth={1.2} aria-hidden="true" />
          </div>
        )}

        {/* Top badges (start side) */}
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

        {/* Image count + favorite */}
        <div className="absolute top-3 end-3 flex items-center gap-2 z-20">
          {annonce.image_count > 1 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              <Camera className="size-3" aria-hidden="true" />
              {annonce.image_count}
            </span>
          )}
          <CompareButton slug={annonce.slug} variant="card" />
          <FavoriteButton annonceId={annonce.id} variant="icon" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-1 leading-tight">
            {annonce.title}
          </h3>
          {annonce.brand?.logo_url && (
            <Image
              src={mediaUrl(annonce.brand.logo_url)}
              alt={annonce.brand.name}
              width={28}
              height={28}
              className="size-7 rounded object-contain shrink-0"
            />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <PriceTag price={annonce.price} priceOnRequest={annonce.price_on_request} size="lg" />
          {annonce.negotiable && (
            <Badge variant="verified">{tDetail("negotiable")}</Badge>
          )}
        </div>

        <ul className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-muted-foreground">
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
        </ul>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          {cityName && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              {cityName}
            </span>
          )}
          {publishedRelative && <span>{publishedRelative}</span>}
        </div>
      </div>
    </Card>
  )
}
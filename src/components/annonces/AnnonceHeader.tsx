"use client"

import { CalendarDays, Eye, MapPin } from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"

import { PriceTag } from "@/components/ui/PriceTag"
import type { AnnonceDetail } from "@/lib/queries/annonce-detail"
import type { Locale } from "@/i18n/routing"

type Props = {
  annonce: AnnonceDetail
}

export function AnnonceHeader({ annonce }: Props) {
  const locale = useLocale() as Locale
  const t = useTranslations("annonceDetail")
  const format = useFormatter()

  const cityName = annonce.city
    ? locale === "ar"
      ? annonce.city.name_ar
      : annonce.city.name_fr
    : null

  const publishedRelative = annonce.published_at
    ? format.relativeTime(new Date(annonce.published_at), new Date())
    : null

  return (
    <header className="space-y-4">
      {/* Price */}
      <div className="flex items-center gap-3 flex-wrap">
        <PriceTag price={annonce.price} size="xl" className="text-4xl md:text-5xl" />
      </div>

      {/* Meta row */}
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {cityName && (
          <li className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-moroccan-mint-500" aria-hidden="true" />
            {cityName}
          </li>
        )}
        {publishedRelative && (
          <li className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 text-moroccan-mint-500" aria-hidden="true" />
            {t("publishedRelative", { when: publishedRelative })}
          </li>
        )}
        <li className="inline-flex items-center gap-1.5">
          <Eye className="size-4 text-moroccan-mint-500" aria-hidden="true" />
          {t("viewCount", { count: annonce.views_count })}
        </li>
      </ul>
    </header>
  )
}
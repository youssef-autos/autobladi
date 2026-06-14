"use client"

import { MapPin } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import type { AnnonceDetail } from "@/lib/queries/annonce-detail"
import type { Locale } from "@/i18n/routing"

type Props = {
  annonce: AnnonceDetail
}

export function AnnonceMap({ annonce }: Props) {
  const locale = useLocale() as Locale
  const t = useTranslations("annonceDetail.map")

  if (!annonce.city) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <MapPin className="size-5 text-moroccan-red-500" aria-hidden="true" />
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("noCity")}</p>
      </section>
    )
  }

  const cityForQuery = `${annonce.city.name_fr}, Morocco`
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(cityForQuery)}&output=embed`

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
      <header className="p-5 border-b border-border">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <MapPin className="size-5 text-moroccan-red-500" aria-hidden="true" />
          {t("title")} — {locale === "ar" ? annonce.city.name_ar : annonce.city.name_fr}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t("desc")}</p>
      </header>
      <div className="relative h-64 md:h-80 bg-moroccan-sand-50">
        <iframe
          src={mapSrc}
          title={cityForQuery}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    </section>
  )
}
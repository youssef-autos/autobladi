"use client"

import { Clock, Info, MapPin } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { OpeningHoursDisplay } from "@/components/professionnels/OpeningHoursDisplay"
import type { ProfessionnelDetail } from "@/lib/queries/professionnels"
import type { Locale } from "@/i18n/routing"

type Props = {
  dealer: ProfessionnelDetail
}

export function AboutTab({ dealer }: Props) {
  const t = useTranslations("professionnels.about")
  const locale = useLocale() as Locale
  const cityName = dealer.city
    ? locale === "ar"
      ? dealer.city.name_ar
      : dealer.city.name_fr
    : null

  const mapSrc =
    dealer.latitude != null && dealer.longitude != null
      ? `https://www.google.com/maps?q=${dealer.latitude},${dealer.longitude}&z=14&output=embed`
      : cityName
        ? `https://www.google.com/maps?q=${encodeURIComponent(`${cityName}, Morocco`)}&output=embed`
        : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Description + address */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <CardHeading icon={Info} title={t("description")} />
        {dealer.description ? (
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {dealer.description}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{t("noDescription")}</p>
        )}

        {(dealer.address || cityName) && (
          <div className="mt-5 border-t border-border pt-5">
            <CardHeading icon={MapPin} title={t("address")} />
            <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
              {dealer.address ? `${dealer.address}, ` : ""}
              {cityName}
            </p>
          </div>
        )}
      </section>

      {/* Hours + Map */}
      <div className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <CardHeading icon={Clock} title={t("hours")} />
          <div className="mt-3">
            <OpeningHoursDisplay hours={dealer.opening_hours} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <header className="px-6 py-4 border-b border-border">
            <CardHeading icon={MapPin} title={t("location")} />
          </header>
          <div className="relative h-56 bg-moroccan-sand-50">
            {mapSrc ? (
              <iframe
                src={mapSrc}
                title="Map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full border-0"
              />
            ) : (
              <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                {t("noLocation")}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

/** Consistent card heading — icon chip + title — used across the storefront. */
function CardHeading({
  icon: Icon,
  title,
}: {
  icon: typeof Info
  title: string
}) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-moroccan-sand-50 text-moroccan-red-500">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <h3 className="font-semibold text-foreground">{title}</h3>
    </div>
  )
}

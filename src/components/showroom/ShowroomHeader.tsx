"use client"

import Image from "next/image"
import { Building2, Calendar, Check, Globe, MapPin, Star } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { getDealerSocials } from "@/components/showroom/socials"
import { Container } from "@/components/ui/Container"
import type { ShowroomDetail } from "@/lib/queries/showrooms"
import type { Locale } from "@/i18n/routing"

type Props = {
  dealer: ShowroomDetail
}

export function ShowroomHeader({ dealer }: Props) {
  const locale = useLocale() as Locale
  const t = useTranslations("showrooms")
  const cityName = dealer.city
    ? locale === "ar"
      ? dealer.city.name_ar
      : dealer.city.name_fr
    : null
  const secteurName = dealer.secteur
    ? locale === "ar"
      ? dealer.secteur.name_ar
      : dealer.secteur.name_fr
    : null
  // City + district shown together; the district is omitted when not set.
  const locationLabel = [cityName, secteurName].filter(Boolean).join(" · ")

  const socials = getDealerSocials(dealer)
  const memberYear = new Date(dealer.created_at).getFullYear()
  const rating = Number(dealer.rating).toFixed(1)

  return (
    <header>
      {/* Cover banner */}
      <div className="relative h-40 sm:h-48 md:h-60 overflow-hidden bg-brand-dark">
        {dealer.cover_url ? (
          <Image
            src={dealer.cover_url}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-moroccan-red-900/40 to-brand-dark" />
        )}
      </div>

      {/* Identity row — no card frame, blends into the page; the logo
          straddles the seam between the cover and the page background. */}
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 pb-5 pt-0">
          {/* Logo — pulled up over the cover's bottom edge */}
          <div className="relative -mt-10 sm:-mt-12 md:-mt-14 shrink-0">
            <div className="size-20 sm:size-24 md:size-28 overflow-hidden rounded-2xl ring-4 ring-background bg-card shadow-lg grid place-items-center">
              {dealer.logo_url ? (
                <Image
                  src={dealer.logo_url}
                  alt={dealer.name}
                  width={112}
                  height={112}
                  className="size-full object-contain"
                />
              ) : (
                <Building2
                  className="size-10 text-moroccan-sand-200"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          {/* Name, location, stats */}
          <div className="flex-1 min-w-0 pt-2 sm:pt-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight truncate">
                {dealer.name}
              </h1>
              {dealer.is_verified && (
                <span
                  title={t("verified")}
                  className="inline-flex shrink-0 items-center justify-center size-5 sm:size-6 rounded-full bg-blue-500 text-white"
                >
                  <Check className="size-3 sm:size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {locationLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {locationLabel}
                </span>
              )}
              {locationLabel && (
                <span className="text-border" aria-hidden="true">·</span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" aria-hidden="true" />
                {t("detail.since")} {memberYear}
              </span>
              <span className="text-border" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Star
                  className="size-4 fill-moroccan-gold-500 text-moroccan-gold-500"
                  aria-hidden="true"
                />
                <strong className="font-semibold text-foreground">{rating}</strong>
                <span>({dealer.reviews_count})</span>
              </span>
            </div>
          </div>

          {/* Social links + website — circular icon buttons (smaller on
              mobile so the full row fits without wrapping) */}
          <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 pt-1 sm:pt-0 sm:self-center shrink-0 overflow-x-auto">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="inline-flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-moroccan-red-500 hover:text-white hover:border-moroccan-red-500 transition-colors"
              >
                <Icon className="size-3.5 sm:size-4" />
              </a>
            ))}
            {dealer.website && (
              <a
                href={dealer.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("sidebar.website")}
                title={t("sidebar.website")}
                className="inline-flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-moroccan-red-500 hover:text-white hover:border-moroccan-red-500 transition-colors"
              >
                <Globe className="size-3.5 sm:size-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </Container>
    </header>
  )
}

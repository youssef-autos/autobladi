"use client"

import Image from "next/image"
import { Building2, Calendar, Crown, Globe, MapPin, Star } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { getDealerSocials } from "@/components/professionnels/socials"
import { Container } from "@/components/ui/Container"
import type { ProfessionnelDetail } from "@/lib/queries/professionnels"
import type { Locale } from "@/i18n/routing"

type Props = {
  dealer: ProfessionnelDetail
}

export function ProfessionnelHeader({ dealer }: Props) {
  const locale = useLocale() as Locale
  const t = useTranslations("professionnels")
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

  const isPro = dealer.owner?.account_type === "pro"
  const socials = getDealerSocials(dealer)
  const memberYear = new Date(dealer.created_at).getFullYear()
  const rating = Number(dealer.rating).toFixed(1)

  return (
    <header>
      {/* Cover banner */}
      <div className="relative h-44 sm:h-56 md:h-72 overflow-hidden bg-brand-dark">
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
        <div
          className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/20 to-transparent"
          aria-hidden="true"
        />
      </div>

      {/* Identity card — overlaps the cover */}
      <Container className="relative z-10 -mt-16 md:-mt-20">
        <div className="rounded-3xl border border-border bg-card shadow-card p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            {/* Logo — with the PRO badge sitting on it */}
            <div className="relative shrink-0 self-center md:self-auto">
              <div className="size-24 md:size-28 overflow-hidden rounded-2xl border-4 border-card bg-card shadow-card grid place-items-center">
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
              {isPro && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-moroccan-gradient px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ring-2 ring-card shadow-sm">
                  <Crown className="size-3" aria-hidden="true" />
                  PRO
                </span>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight truncate">
                  {dealer.name}
                </h1>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4 text-moroccan-gold-500" aria-hidden="true" />
                  {t("detail.since")} {memberYear}
                </span>
                {locationLabel && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-moroccan-gold-500" aria-hidden="true" />
                    {locationLabel}
                  </span>
                )}
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

            {/* Social links + website */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-moroccan-red-500 hover:text-white hover:border-moroccan-red-500 transition-colors"
                >
                  <Icon className="size-5" />
                </a>
              ))}
              {dealer.website && (
                <a
                  href={dealer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("sidebar.website")}
                  title={t("sidebar.website")}
                  className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-moroccan-red-500 hover:text-white hover:border-moroccan-red-500 transition-colors"
                >
                  <Globe className="size-5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>
      </Container>
    </header>
  )
}

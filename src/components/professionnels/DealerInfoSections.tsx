"use client"

import type { ComponentType } from "react"
import {
  Clock,
  Headset,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { OpeningHoursDisplay } from "@/components/professionnels/OpeningHoursDisplay"
import type { ProfessionnelDetail } from "@/lib/queries/professionnels"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  dealer: ProfessionnelDetail
}

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

const accentStyles: Record<"red" | "mint" | "gold", { chip: string; hover: string }> = {
  red: {
    chip: "bg-moroccan-red-500 text-white",
    hover: "hover:border-moroccan-red-500/40 hover:bg-moroccan-red-50/50",
  },
  mint: {
    chip: "bg-moroccan-mint-500 text-white",
    hover: "hover:border-moroccan-mint-500/40 hover:bg-moroccan-mint-500/5",
  },
  gold: {
    chip: "bg-moroccan-gold-500 text-white",
    hover: "hover:border-moroccan-gold-500/40 hover:bg-moroccan-gold-50/50",
  },
}

/** Simple contact action — icon chip + label, without revealing the value. */
function ContactButton({
  href,
  icon: Icon,
  accent,
  label,
  external = false,
}: {
  href: string
  icon: ComponentType<{ className?: string }>
  accent: "red" | "mint" | "gold"
  label: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={label}
      className={cn(
        "group flex flex-1 min-w-[88px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-card px-2 py-4 transition-all hover:shadow-card",
        accentStyles[accent].hover,
      )}
    >
      <span
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110",
          accentStyles[accent].chip,
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="text-xs font-semibold text-foreground text-center">{label}</span>
    </a>
  )
}

function cityNameFor(dealer: ProfessionnelDetail, locale: Locale) {
  if (!dealer.city) return null
  return locale === "ar" ? dealer.city.name_ar : dealer.city.name_fr
}

function secteurNameFor(dealer: ProfessionnelDetail, locale: Locale) {
  if (!dealer.secteur) return null
  return locale === "ar" ? dealer.secteur.name_ar : dealer.secteur.name_fr
}

/** About: description + address + contact (phone, whatsapp, email). */
export function DealerAbout({ dealer }: Props) {
  const t = useTranslations("professionnels")
  const locale = useLocale() as Locale
  const cityName = cityNameFor(dealer, locale)
  const secteurName = secteurNameFor(dealer, locale)
  const wa = dealer.whatsapp ? dealer.whatsapp.replace(/\D/g, "") : null

  const hasContact = !!dealer.phone || !!wa || !!dealer.email

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <CardHeading icon={Info} title={t("about.description")} />
      {dealer.description ? (
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
          {dealer.description}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{t("about.noDescription")}</p>
      )}

      {(dealer.address || secteurName || cityName) && (
        <div className="mt-5 border-t border-border pt-5">
          <CardHeading icon={MapPin} title={t("about.address")} />
          <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
            {[dealer.address, secteurName, cityName].filter(Boolean).join("، ")}
          </p>
        </div>
      )}

      {/* Contact */}
      {hasContact && (
        <div className="mt-5 border-t border-border pt-5">
          <CardHeading icon={Headset} title={t("about.contact")} />
          <div className="mt-3 flex flex-wrap gap-2">
            {dealer.phone && (
              <ContactButton
                href={`tel:${dealer.phone.replace(/\s/g, "")}`}
                icon={Phone}
                accent="red"
                label={t("detail.phone")}
              />
            )}
            {wa && (
              <ContactButton
                href={`https://wa.me/${wa.replace(/^0/, "212")}`}
                external
                icon={MessageCircle}
                accent="mint"
                label={t("detail.whatsapp")}
              />
            )}
            {dealer.email && (
              <ContactButton
                href={`mailto:${dealer.email}`}
                icon={Mail}
                accent="gold"
                label={t("detail.email")}
              />
            )}
          </div>
        </div>
      )}
    </section>
  )
}

/** Opening hours. */
export function DealerHours({ dealer }: Props) {
  const t = useTranslations("professionnels.about")
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <CardHeading icon={Clock} title={t("hours")} />
      <div className="mt-3">
        <OpeningHoursDisplay hours={dealer.opening_hours} />
      </div>
    </section>
  )
}

/** Location map. */
export function DealerLocation({ dealer }: Props) {
  const t = useTranslations("professionnels.about")
  const locale = useLocale() as Locale
  const cityName = cityNameFor(dealer, locale)
  const secteurName = secteurNameFor(dealer, locale)

  // Prefer a human-readable place (address + district + city) so the map shows
  // the name rather than raw coordinates. Fall back to lat/lng if no name set.
  const placeName = [dealer.address, secteurName, cityName].filter(Boolean).join(", ")
  const mapSrc = placeName
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${placeName}, Morocco`)}&z=13&output=embed`
    : dealer.latitude != null && dealer.longitude != null
      ? `https://www.google.com/maps?q=${dealer.latitude},${dealer.longitude}&z=14&output=embed`
      : null

  return (
    <section className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <header className="px-5 py-3.5 border-b border-border">
        <CardHeading icon={MapPin} title={t("location")} />
      </header>
      <div className="relative h-48 bg-moroccan-sand-50">
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
  )
}

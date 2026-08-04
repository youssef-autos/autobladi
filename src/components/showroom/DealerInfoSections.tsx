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

import { OpeningHoursDisplay } from "@/components/showroom/OpeningHoursDisplay"
import type { ShowroomDetail } from "@/lib/queries/showrooms"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  dealer: ShowroomDetail
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

const contactVariants: Record<"phone" | "whatsapp" | "email", string> = {
  phone:
    "border-2 border-moroccan-red-500 text-moroccan-red-500 bg-background hover:bg-moroccan-red-50",
  whatsapp: "bg-moroccan-mint-500 text-white hover:brightness-105",
  email: "border-2 border-border text-foreground bg-background hover:bg-moroccan-sand-50",
}

/** Full-width contact action button — outlined Call, solid WhatsApp, etc. */
function ContactButton({
  href,
  icon: Icon,
  variant,
  label,
  external = false,
}: {
  href: string
  icon: ComponentType<{ className?: string }>
  variant: "phone" | "whatsapp" | "email"
  label: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "flex w-full items-center justify-center gap-2 h-12 rounded-xl text-base font-bold transition-colors",
        contactVariants[variant],
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
      {label}
    </a>
  )
}

function cityNameFor(dealer: ShowroomDetail, locale: Locale) {
  if (!dealer.city) return null
  return locale === "ar" ? dealer.city.name_ar : dealer.city.name_fr
}

function secteurNameFor(dealer: ShowroomDetail, locale: Locale) {
  if (!dealer.secteur) return null
  return locale === "ar" ? dealer.secteur.name_ar : dealer.secteur.name_fr
}

/** About: description + address + contact (phone, whatsapp, email). */
export function DealerAbout({ dealer }: Props) {
  const t = useTranslations("showrooms")
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
          <div className="mt-3 flex flex-col gap-3">
            {dealer.phone && (
              <ContactButton
                href={`tel:${dealer.phone.replace(/\s/g, "")}`}
                icon={Phone}
                variant="phone"
                label={t("detail.callAction")}
              />
            )}
            {wa && (
              <ContactButton
                href={`https://wa.me/${wa.replace(/^0/, "212")}`}
                external
                icon={MessageCircle}
                variant="whatsapp"
                label={t("detail.whatsapp")}
              />
            )}
            {dealer.email && (
              <ContactButton
                href={`mailto:${dealer.email}`}
                icon={Mail}
                variant="email"
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
  const t = useTranslations("showrooms.about")
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
  const t = useTranslations("showrooms.about")
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

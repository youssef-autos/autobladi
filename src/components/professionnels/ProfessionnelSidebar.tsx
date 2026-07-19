"use client"

import {
  ArrowRight,
  Car,
  Globe,
  Headset,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { ProfessionnelDetail } from "@/lib/queries/professionnels"
import { formatPhone } from "@/lib/utils/format"

type Props = {
  dealer: ProfessionnelDetail
}

type IconProps = { className?: string }

// Brand glyphs (lucide dropped its brand icons). Single-path, currentColor.
function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.1-2.82h-3.1v12.3a2.5 2.5 0 1 1-2.5-2.5c.27 0 .53.04.78.12V9.74a5.6 5.6 0 0 0-.78-.06A5.62 5.62 0 1 0 15.5 15.3V9.01a7.3 7.3 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.2-1.48Z" />
    </svg>
  )
}

export function ProfessionnelSidebar({ dealer }: Props) {
  const t = useTranslations("professionnels")
  const wa = dealer.whatsapp ? dealer.whatsapp.replace(/\D/g, "") : null

  const socials: {
    href: string
    label: string
    Icon: React.ComponentType<{ className?: string }>
  }[] = []
  if (dealer.facebook) socials.push({ href: dealer.facebook, label: "Facebook", Icon: FacebookIcon })
  if (dealer.instagram) socials.push({ href: dealer.instagram, label: "Instagram", Icon: InstagramIcon })
  if (dealer.youtube) socials.push({ href: dealer.youtube, label: "YouTube", Icon: YoutubeIcon })
  if (dealer.tiktok) socials.push({ href: dealer.tiktok, label: "TikTok", Icon: TikTokIcon })

  return (
    <aside className="space-y-4">
      {/* Contact card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-moroccan-sand-50 text-moroccan-red-500">
            <Headset className="size-4" aria-hidden="true" />
          </span>
          <h3 className="font-semibold text-foreground">{t("about.contact")}</h3>
        </div>

        <div className="space-y-2.5">
          {dealer.phone && (
            <a
              href={`tel:${dealer.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all tabular-nums"
            >
              <Phone className="size-4" aria-hidden="true" />
              {formatPhone(dealer.phone)}
            </a>
          )}

          {wa && (
            <a
              href={`https://wa.me/${wa.replace(/^0/, "212")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-moroccan-mint-500 text-white text-sm font-semibold hover:brightness-105 transition-all"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {t("sidebar.whatsapp")}
            </a>
          )}

          {(dealer.email || dealer.website) && (
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {dealer.email && (
                <a
                  href={`mailto:${dealer.email}`}
                  className="inline-flex items-center gap-2.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-moroccan-sand-50 transition-colors"
                >
                  <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{t("sidebar.email")}</span>
                </a>
              )}
              {dealer.website && (
                <a
                  href={dealer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-moroccan-sand-50 transition-colors"
                >
                  <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{t("sidebar.website")}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {socials.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-moroccan-red-500 hover:text-white hover:border-moroccan-red-500 transition-colors"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* All cars from this dealer */}
      <Link
        href={`/annonces?seller=${dealer.slug}`}
        className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-card hover:bg-moroccan-sand-50 transition-colors"
      >
        <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-moroccan-sand-50 text-moroccan-red-500">
            <Car className="size-4" aria-hidden="true" />
          </span>
          {t("sidebar.contactCta")}
        </span>
        <ArrowRight className="size-4 text-muted-foreground rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
      </Link>
    </aside>
  )
}

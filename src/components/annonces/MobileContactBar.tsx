"use client"

import { useState } from "react"
import { Phone } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { ShareMenu } from "@/components/annonces/ShareMenu"
import { trackAdEvent } from "@/lib/track-ad-event"
import { formatPhone } from "@/lib/utils/format"

type Props = {
  annonceId: string
  annonceSlug: string
  title: string
  contactPhone: string | null
  contactWhatsapp: string | null
}

/**
 * Sticky bottom action bar shown on mobile only (the desktop layout already
 * keeps ContactSidebar visible in the sticky aside). Keeps Call + WhatsApp +
 * Share always reachable without scrolling on the annonce detail page.
 */
export function MobileContactBar({
  annonceId,
  annonceSlug,
  title,
  contactPhone,
  contactWhatsapp,
}: Props) {
  const t = useTranslations("annonceDetail.contact")
  const locale = useLocale()
  const [revealed, setRevealed] = useState(false)

  const wa = contactWhatsapp ? contactWhatsapp.replace(/\D/g, "") : null
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/annonces/${annonceSlug}`
      : `https://autobladi.ma/${locale}/annonces/${annonceSlug}`

  if (!contactPhone && !wa) return null

  function handleCall() {
    // No account required to reveal the phone (same as the WhatsApp button).
    setRevealed(true)
    trackAdEvent(annonceId, "phone_click")
  }

  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        {contactPhone &&
          (!revealed ? (
            <button
              type="button"
              onClick={handleCall}
              className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan active:brightness-95"
            >
              <Phone className="size-4" aria-hidden="true" />
              {t("revealPhone")}
            </button>
          ) : (
            <a
              href={`tel:${contactPhone.replace(/\s/g, "")}`}
              className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan active:brightness-95 tabular-nums"
            >
              <Phone className="size-4" aria-hidden="true" />
              {formatPhone(contactPhone)}
            </a>
          ))}

        {wa && (
          <a
            href={`https://wa.me/${wa.replace(/^0/, "212")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAdEvent(annonceId, "whatsapp_click")}
            className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-moroccan-mint-500 text-white text-sm font-semibold active:brightness-95"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
              <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1s-.8.9-1 1.1c-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1-1.1 2.5 0 1.5 1.1 2.9 1.2 3.1.1.2 2.2 3.3 5.3 4.6 2.6 1 3 .8 3.6.8.6 0 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.1-.6-.2zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.4 1.2 4.8L2 22l5.3-1.2C8.7 21.6 10.3 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z" />
            </svg>
            {t("whatsapp")}
          </a>
        )}

        <ShareMenu url={shareUrl} title={title} compact />
      </div>
    </div>
  )
}

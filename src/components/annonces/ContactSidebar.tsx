"use client"

import { useState } from "react"
import { GitCompare, Phone } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { Link } from "@/i18n/navigation"
import { FavoriteButton } from "@/components/annonces/FavoriteButton"
import { MessageDialog } from "@/components/annonces/MessageDialog"
import { ReportDialog } from "@/components/annonces/ReportDialog"
import { ShareMenu } from "@/components/annonces/ShareMenu"
import { useUser } from "@/hooks/use-user"
import { formatPhone } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

type Props = {
  annonceId: string
  annonceSlug: string
  title: string
  sellerId: string
  contactPhone: string | null
  contactWhatsapp: string | null
  className?: string
}

export function ContactSidebar({
  annonceId,
  annonceSlug,
  title,
  sellerId,
  contactPhone,
  contactWhatsapp,
  className,
}: Props) {
  const t = useTranslations("annonceDetail.contact")
  const tNav = useTranslations("nav")
  const locale = useLocale()
  const { user, loading } = useUser()
  const [revealed, setRevealed] = useState(false)

  const isAuthed = !loading && !!user
  const phone = formatPhone(contactPhone)
  const wa = contactWhatsapp ? contactWhatsapp.replace(/\D/g, "") : null

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/annonces/${annonceSlug}`
      : `https://autobladi.ma/${locale}/annonces/${annonceSlug}`

  function handleReveal() {
    if (!isAuthed) {
      toast.error(t("loginRequired"))
      return
    }
    setRevealed(true)
  }

  function handleCompare() {
    toast.success(t("compare"))
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Phone reveal / call */}
      {contactPhone && (
        <div className="flex flex-col gap-2">
          {!revealed ? (
            <button
              type="button"
              onClick={handleReveal}
              className="inline-flex items-center justify-center gap-2 h-12 w-full rounded-xl bg-moroccan-gradient text-white text-base font-semibold shadow-moroccan hover:brightness-105 transition-all"
            >
              <Phone className="size-4" aria-hidden="true" />
              {t("revealPhone")}
            </button>
          ) : (
            <a
              href={`tel:${contactPhone.replace(/\s/g, "")}`}
              className="inline-flex items-center justify-center gap-2 h-12 w-full rounded-xl bg-moroccan-gradient text-white text-base font-semibold shadow-moroccan hover:brightness-105 transition-all tabular-nums"
            >
              <Phone className="size-4" aria-hidden="true" />
              {phone}
            </a>
          )}
        </div>
      )}

      {wa && (
        <a
          href={`https://wa.me/${wa.replace(/^0/, "212")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-moroccan-mint-500 text-white font-semibold hover:brightness-105 transition-all"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
            <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1s-.8.9-1 1.1c-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1-1.1 2.5 0 1.5 1.1 2.9 1.2 3.1.1.2 2.2 3.3 5.3 4.6 2.6 1 3 .8 3.6.8.6 0 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.1-.6-.2zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.4 1.2 4.8L2 22l5.3-1.2C8.7 21.6 10.3 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z" />
          </svg>
          {t("whatsapp")}
        </a>
      )}

      <MessageDialog receiverId={sellerId} annonceId={annonceId} />

      <div className="grid grid-cols-2 gap-2">
        <FavoriteButton annonceId={annonceId} variant="wide" />
        <button
          type="button"
          onClick={handleCompare}
          className="inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
        >
          <GitCompare className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t("compare").split(" ")[0]}</span>
        </button>
      </div>

      <ShareMenu url={shareUrl} title={title} />

      <div className="flex justify-center pt-2">
        <ReportDialog annonceId={annonceId} />
      </div>

      {!isAuthed && !loading && (
        <p className="text-xs text-muted-foreground text-center">
          {t("loginRequired")} —{" "}
          <Link href="/auth/connexion" className="text-moroccan-red-500 hover:underline">
            {tNav("login")}
          </Link>
        </p>
      )}
    </div>
  )
}

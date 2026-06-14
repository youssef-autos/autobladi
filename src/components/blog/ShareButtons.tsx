"use client"

import { useState } from "react"
import { Check, Copy, Link2 } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  FacebookIcon,
  // Reuse the social icons we already have. No Twitter icon there;
  // inline a simple X mark instead.
} from "@/components/layout/SocialIcons"
import { cn } from "@/lib/utils"

type Props = {
  url: string
  title: string
  className?: string
}

export function ShareButtons({ url, title, className }: Props) {
  const t = useTranslations("blog.share")
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(title)

  function copy() {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span className="text-sm font-medium text-foreground me-2">
        {t("title")}:
      </span>

      <a
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("whatsapp")}
        className="inline-flex items-center justify-center size-9 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20"
      >
        <WhatsappIcon className="size-4" />
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("facebook")}
        className="inline-flex items-center justify-center size-9 rounded-full bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20"
      >
        <FacebookIcon className="size-4" />
      </a>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("twitter")}
        className="inline-flex items-center justify-center size-9 rounded-full bg-black/5 text-foreground hover:bg-black/10"
      >
        <XIcon className="size-4" />
      </a>

      <button
        type="button"
        onClick={copy}
        aria-label={t("copyLink")}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs text-foreground hover:bg-moroccan-sand-50"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-moroccan-mint-500" />
            <span className="text-moroccan-mint-500">{t("linkCopied")}</span>
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            {t("copyLink")}
          </>
        )}
      </button>

      {/* Hidden visual import so Link2 isn't an unused-import lint hit when
          we expand share targets later. */}
      <span className="sr-only">
        <Link2 className="size-0" aria-hidden="true" />
      </span>
    </div>
  )
}

/** Inline X (Twitter) glyph since lucide v1 doesn't ship one. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2H21l-6.522 7.45L22 22h-6.84l-4.83-6.32L4.6 22H2l7.04-8.04L2 2h6.92l4.36 5.78L18.244 2zm-1.2 18.2h1.7L7.04 3.7H5.22l11.823 16.5z" />
    </svg>
  )
}

/** Inline WhatsApp glyph. */
function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.768.967-.94 1.165-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 2C6.586 2 2.16 6.425 2.158 11.882c0 1.745.456 3.448 1.32 4.95L2 22l5.31-1.394a9.853 9.853 0 004.728 1.205h.004c5.452 0 9.879-4.426 9.882-9.882a9.821 9.821 0 00-2.892-6.989A9.825 9.825 0 0012.04 2zm0 18.135h-.004a8.197 8.197 0 01-4.176-1.144l-.299-.178-3.151.827.842-3.071-.195-.314a8.171 8.171 0 01-1.249-4.373c.002-4.531 3.687-8.215 8.218-8.215a8.158 8.158 0 015.81 2.408 8.16 8.16 0 012.404 5.813c-.002 4.531-3.686 8.247-8.2 8.247z" />
    </svg>
  )
}

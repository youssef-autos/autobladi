"use client"

import { Video } from "lucide-react"
import { useTranslations } from "next-intl"

import { getVideoEmbed } from "@/lib/video-embed"
import { cn } from "@/lib/utils"
import type { AnnonceDetail } from "@/lib/queries/annonce-detail"

type Props = {
  annonce: AnnonceDetail
}

/**
 * Promo video for a listing (YouTube / Facebook / TikTok). Pros-only at the
 * input side; here we just render whatever was saved. Hidden when empty or the
 * URL isn't from a supported platform.
 */
export function AnnonceVideo({ annonce }: Props) {
  const t = useTranslations("annonceDetail")
  const embed = getVideoEmbed(annonce.video_url)
  if (!embed) return null

  return (
    <section className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-5 md:p-7">
        <h2 className="flex items-center gap-3 border-b-2 border-moroccan-red-500/25 pb-3 font-display text-xl md:text-2xl font-bold text-moroccan-red-600">
          <span
            className="inline-flex size-7 items-center justify-center rounded-lg bg-moroccan-red-500/10 text-moroccan-red-500"
            aria-hidden="true"
          >
            <Video className="size-5" />
          </span>
          {t("video.title")}
        </h2>
        <div
          className={cn(
            "relative mt-5 w-full overflow-hidden rounded-xl bg-black",
            embed.vertical ? "mx-auto max-w-[360px] aspect-[9/16]" : "aspect-video",
          )}
        >
          <iframe
            src={embed.src}
            title={t("video.title")}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </section>
  )
}

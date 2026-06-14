"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Camera, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { AnnonceImage } from "@/lib/queries/annonce-detail"
import { cn } from "@/lib/utils"

type Props = {
  images: AnnonceImage[]
  title: string
  /** Vehicle condition — shown as a badge over the main image. */
  condition?: "neuf" | "occasion" | null
  /** Featured listing — shown as a highlighted badge over the main image. */
  featured?: boolean
}

export function ImageGallery({ images, title, condition, featured }: Props) {
  const t = useTranslations("annonceDetail")
  const tBadges = useTranslations("home.badges")
  const [selected, setSelected] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const hasImages = images.length > 0
  const safeIndex = Math.min(selected, Math.max(0, images.length - 1))

  const next = useCallback(() => {
    if (images.length === 0) return
    setSelected((i) => (i + 1) % images.length)
  }, [images.length])

  const prev = useCallback(() => {
    if (images.length === 0) return
    setSelected((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "Escape") setLightbox(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [lightbox, next, prev])

  if (!hasImages) {
    return (
      <div className="relative aspect-[16/10] rounded-2xl bg-moroccan-sand-50 border border-border flex items-center justify-center">
        <Camera className="size-12 text-moroccan-sand-200" strokeWidth={1.2} aria-hidden="true" />
      </div>
    )
  }

  const main = images[safeIndex]

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-moroccan-sand-50 border border-border group">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute inset-0 z-10 cursor-zoom-in"
          aria-label={t("viewAllPhotos", { count: images.length })}
        >
          <Image
            src={main.url}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 800px"
            className="object-cover"
          />
        </button>

        {/* Highlight badges — top start corner (featured first, then condition) */}
        {(featured || condition) && (
          <div className="absolute top-3 start-3 z-20 flex flex-col items-start gap-2">
            {featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-moroccan-gold-500 to-moroccan-gold-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                <Sparkles className="size-3" aria-hidden="true" />
                {tBadges("featured")}
              </span>
            )}
            {condition && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md",
                  condition === "neuf"
                    ? "bg-moroccan-mint-500"
                    : "bg-moroccan-red-500",
                )}
              >
                {condition === "neuf"
                  ? t("history.conditionNew")
                  : t("history.conditionUsed")}
              </span>
            )}
          </div>
        )}

        {images.length > 1 && (
          <>
            <NavButton side="start" onClick={prev} label={t("previousImage")} />
            <NavButton side="end" onClick={next} label={t("nextImage")} />
          </>
        )}

        <span className="absolute bottom-3 end-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <Camera className="size-3" aria-hidden="true" />
          {t("imageCounter", { current: safeIndex + 1, total: images.length })}
        </span>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelected(idx)}
              aria-label={`${idx + 1}`}
              aria-current={idx === safeIndex ? "true" : undefined}
              className={cn(
                "relative aspect-[4/3] w-24 sm:w-28 shrink-0 rounded-lg overflow-hidden bg-moroccan-sand-50 border-2 transition-all snap-start",
                idx === safeIndex
                  ? "border-moroccan-red-500 ring-2 ring-moroccan-red-500/20"
                  : "border-transparent hover:border-moroccan-gold-500/50",
              )}
            >
              <Image
                src={img.thumbnail_url ?? img.url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-screen-lg p-0 bg-transparent border-0 shadow-none">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="relative w-full aspect-video bg-black/95 rounded-2xl overflow-hidden">
            <Image
              src={main.url}
              alt={title}
              fill
              sizes="100vw"
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label={t("closeLightbox")}
              className="absolute top-3 end-3 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <X className="size-5" />
            </button>

            {images.length > 1 && (
              <>
                <NavButton side="start" onClick={prev} label={t("previousImage")} variant="lightbox" />
                <NavButton side="end" onClick={next} label={t("nextImage")} variant="lightbox" />
              </>
            )}

            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {t("imageCounter", { current: safeIndex + 1, total: images.length })}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NavButton({
  side,
  onClick,
  label,
  variant = "default",
}: {
  side: "start" | "end"
  onClick: () => void
  label: string
  variant?: "default" | "lightbox"
}) {
  const Icon = side === "start" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={label}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center size-10 rounded-full backdrop-blur-sm transition-opacity rtl:scale-x-[-1]",
        side === "start" ? "start-3" : "end-3",
        variant === "lightbox"
          ? "bg-white/10 text-white hover:bg-white/20"
          : "bg-white/90 text-foreground opacity-0 group-hover:opacity-100 hover:bg-white",
      )}
    >
      <Icon className="size-5" />
    </button>
  )
}

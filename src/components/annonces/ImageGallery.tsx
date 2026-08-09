"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { AnnonceImage } from "@/lib/queries/annonce-detail"
import { cn } from "@/lib/utils"

type Props = {
  images: AnnonceImage[]
  title: string
  /** Vehicle condition — shown as a badge over the main image. */
  condition?: "neuf" | "occasion" | null
}

// Minimum horizontal drag (px) before a touch gesture counts as a swipe
// rather than a tap that opens the lightbox.
const SWIPE_THRESHOLD = 40

export function ImageGallery({ images, title, condition }: Props) {
  const t = useTranslations("annonceDetail")
  const isRtl = useLocale() === "ar"
  const [selected, setSelected] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const didSwipe = useRef(false)
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([])

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

  // Keep the active thumbnail in view when selection changes via swipe/arrows.
  useEffect(() => {
    thumbRefs.current[safeIndex]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    })
  }, [safeIndex])

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
    didSwipe.current = false
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStart.current.x
    const dy = touch.clientY - touchStart.current.y
    touchStart.current = null

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      didSwipe.current = true
      // Swiping left physically reveals what comes after in reading order —
      // that's "next" in LTR, but "prev" in RTL (mirrors the nav arrows,
      // which already flip via rtl:scale-x-[-1]).
      const swipedLeft = dx < 0
      if (swipedLeft === !isRtl) next()
      else prev()
    }
  }

  function handleFrameClick() {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    setLightbox(true)
  }

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
      {/* One seamless rounded frame: main photo on top, edge-to-edge
          scrollable filmstrip directly below — no gap between them. */}
      <div className="rounded-2xl overflow-hidden border border-border bg-moroccan-sand-50">
        <div
          role="button"
          tabIndex={0}
          onClick={handleFrameClick}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setLightbox(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-label={t("viewAllPhotos", { count: images.length })}
          className="relative aspect-[16/10] overflow-hidden group cursor-zoom-in touch-pan-y select-none"
        >
          {/* Blurred fill so photos of any aspect ratio never look cropped or
              letterboxed with dead space. */}
          <Image
            key={`bg-${main.id}`}
            src={main.url}
            alt=""
            fill
            aria-hidden="true"
            sizes="(max-width: 1024px) 100vw, 800px"
            className="object-cover scale-110 blur-2xl opacity-60 animate-in fade-in duration-300"
          />
          <Image
            key={main.id}
            src={main.url}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 800px"
            className="relative object-contain animate-in fade-in duration-300"
          />

          {/* Highlight badge — top start corner (vehicle condition) */}
          {condition && (
            <div className="absolute top-3 start-3 z-20 flex flex-col items-start gap-2">
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

        {/* Filmstrip — thumbnails sit flush against each other, scrollable
            horizontally; the active one gets an inset ring, the rest dim
            slightly until hovered or tapped. */}
        {images.length > 1 && (
          <div className="flex overflow-x-auto snap-x border-t border-border">
            {images.map((img, idx) => (
              <button
                key={img.id}
                ref={(el) => {
                  thumbRefs.current[idx] = el
                }}
                type="button"
                onClick={() => setSelected(idx)}
                aria-label={`${idx + 1}`}
                aria-current={idx === safeIndex ? "true" : undefined}
                className={cn(
                  "relative aspect-[4/3] w-20 sm:w-24 shrink-0 snap-start transition-opacity",
                  idx === safeIndex
                    ? "z-10 opacity-100 ring-2 ring-inset ring-moroccan-red-500"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={img.thumbnail_url ?? img.url}
                  alt={t("thumbnailAlt", { title, number: idx + 1 })}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent
          showCloseButton={false}
          className="max-w-none sm:max-w-none w-screen h-dvh p-0 bg-transparent border-0 shadow-none rounded-none"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div
            className="relative w-full h-full bg-black touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              key={main.id}
              src={main.url}
              alt={title}
              fill
              sizes="100vw"
              className="object-contain animate-in fade-in duration-300"
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
        "absolute top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center size-10 rounded-full backdrop-blur-sm transition-colors rtl:scale-x-[-1]",
        side === "start" ? "start-3" : "end-3",
        variant === "lightbox"
          ? "bg-white/10 text-white hover:bg-white/20"
          : "bg-white/80 text-foreground hover:bg-white",
      )}
    >
      <Icon className="size-5" />
    </button>
  )
}

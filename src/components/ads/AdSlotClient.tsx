"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Megaphone } from "lucide-react"

import { AdLink } from "@/components/ads/AdLink"
import { ADSENSE, type AdSlotConfig } from "@/config/ads.config"
import { useInView } from "@/hooks/use-in-view"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

/** Minimal shape of a direct campaign, resolved server-side from the DB. */
export type DirectAd = {
  id: string
  title: string
  image_url: string
  link_url: string | null
}

type Props = {
  slot: AdSlotConfig
  /** Active direct campaign for this slot, or null → fall back to AdSense. */
  directAd: DirectAd | null
  /** Localized "Advertisement" label. */
  label: string
  className?: string
}

/**
 * Renders a single ad slot on the client. Responsibilities:
 *   - reserve device-correct space via CSS variables (no Cumulative Layout Shift)
 *   - gate visibility by device purely in CSS (`data-device`) — no hydration flash
 *   - lazy-mount the actual creative once it scrolls near the viewport
 *   - prefer a direct campaign, otherwise an AdSense unit, otherwise nothing
 *   - show a subtle skeleton until the creative is mounted
 *
 * Tailwind can't generate arbitrary classes from runtime sizes, so the reserved
 * box is sized with CSS custom properties consumed by the `.ad-slot` rule in
 * globals.css (mobile by default, desktop at the `md` breakpoint).
 */
export function AdSlotClient({ slot, directAd, label, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, "300px")
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Concrete viewport device — only meaningful after mount.
  const deviceActive =
    slot.device === "both"
      ? true
      : slot.device === "desktop"
        ? isDesktop
        : !isDesktop

  const eager = slot.lazy === false
  const ready = mounted && deviceActive && (eager || inView)

  // Active-device size (used to size the AdSense <ins> exactly → CLS-safe).
  const size = isDesktop ? slot.sizes.desktop : slot.sizes.mobile

  // Resolution: direct campaign wins; else AdSense if this slot opts into it.
  const canAdsense =
    !directAd &&
    slot.defaultProvider === "adsense" &&
    Boolean(slot.adsenseSlotId) &&
    ADSENSE.enabled

  const styleVars = {
    "--ad-w": `${slot.sizes.mobile.width}px`,
    "--ad-h": `${slot.sizes.mobile.height}px`,
    "--ad-w-md": `${slot.sizes.desktop.width}px`,
    "--ad-h-md": `${slot.sizes.desktop.height}px`,
  } as React.CSSProperties

  return (
    <div
      ref={ref}
      data-device={slot.device}
      style={styleVars}
      className={cn(
        "ad-slot relative mx-auto overflow-hidden rounded-2xl",
        className,
      )}
    >
      {!ready ? (
        <AdSkeleton label={label} />
      ) : directAd ? (
        <>
          <span
            aria-hidden="true"
            className="absolute top-2 end-2 z-10 inline-flex items-center rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/90"
          >
            {label}
          </span>
          <AdLink
            adId={directAd.id}
            href={directAd.link_url}
            title={directAd.title}
            className="block size-full"
          >
            <Image
              src={directAd.image_url}
              alt={directAd.title}
              fill
              sizes={`${size.width}px`}
              className="object-contain"
            />
          </AdLink>
        </>
      ) : canAdsense ? (
        <AdSenseUnit
          clientId={ADSENSE.clientId}
          slotId={slot.adsenseSlotId!}
          width={size.width}
          height={size.height}
        />
      ) : (
        // No direct campaign and AdSense not applicable → keep the reserved
        // space empty but unobtrusive (so the layout stays stable).
        <AdSkeleton label={label} />
      )}
    </div>
  )
}

/** Subtle, fixed-size loading state — fills the already-reserved box. */
function AdSkeleton({ label }: { label: string }) {
  return (
    <div
      role="complementary"
      aria-label="Advertisement placeholder"
      className="flex size-full items-center justify-center rounded-2xl border border-dashed border-moroccan-gold-500/30 bg-moroccan-gold-50/20 text-muted-foreground"
    >
      <span className="flex items-center gap-1.5 text-xs font-medium opacity-70">
        <Megaphone className="size-3.5 text-moroccan-gold-600" aria-hidden="true" />
        {label}
      </span>
    </div>
  )
}

/**
 * A single Google AdSense unit. Pushes to the `adsbygoogle` queue exactly once
 * on mount. The global loader script lives in the root layout, so this only
 * renders the <ins> tag and triggers a fill request.
 */
function AdSenseUnit({
  clientId,
  slotId,
  width,
  height,
}: {
  clientId: string
  slotId: string
  width: number
  height: number
}) {
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] }
      w.adsbygoogle = w.adsbygoogle || []
      w.adsbygoogle.push({})
    } catch {
      // AdSense not loaded (dev / blocked) — fail silently.
    }
  }, [])

  return (
    <ins
      className="adsbygoogle block"
      style={{ display: "inline-block", width, height }}
      data-ad-client={clientId}
      data-ad-slot={slotId}
    />
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Megaphone } from "lucide-react"

import { AdLink } from "@/components/ads/AdLink"
import type { ResolvedAdSlot } from "@/config/ads.config"
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
  /** Fully-resolved slot settings (DB overrides merged over code defaults). */
  settings: ResolvedAdSlot
  /** Active direct campaign for this slot, or null → fall back to AdSense. */
  directAd: DirectAd | null
  /** Google AdSense publisher id ("ca-pub-…"), admin-managed. */
  adsenseClientId: string
  /** Whether AdSense is configured site-wide. */
  adsenseEnabled: boolean
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
 */
export function AdSlotClient({
  settings,
  directAd,
  adsenseClientId,
  adsenseEnabled,
  label,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, "300px")
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Concrete viewport device — only meaningful after mount.
  const deviceActive =
    settings.device === "both"
      ? true
      : settings.device === "desktop"
        ? isDesktop
        : !isDesktop

  const eager = settings.lazy === false
  const ready = mounted && deviceActive && (eager || inView)

  // Active-device size (used to size the AdSense <ins> exactly → CLS-safe).
  const size = isDesktop ? settings.sizes.desktop : settings.sizes.mobile

  // Resolution: direct campaign wins; else AdSense if this slot opts into it.
  const canAdsense =
    !directAd &&
    settings.defaultProvider === "adsense" &&
    Boolean(settings.adsenseSlotId) &&
    adsenseEnabled

  const styleVars = {
    "--ad-w": `${settings.sizes.mobile.width}px`,
    "--ad-h": `${settings.sizes.mobile.height}px`,
    "--ad-w-md": `${settings.sizes.desktop.width}px`,
    "--ad-h-md": `${settings.sizes.desktop.height}px`,
  } as React.CSSProperties

  return (
    <div
      ref={ref}
      data-device={settings.device}
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
          clientId={adsenseClientId}
          slotId={settings.adsenseSlotId}
          width={size.width}
          height={size.height}
        />
      ) : (
        // No direct campaign and AdSense not applicable → keep the reserved
        // space but unobtrusive (so the layout stays stable).
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

import Image from "next/image"
import { getTranslations } from "next-intl/server"

import { AdLink } from "@/components/ads/AdLink"
import { AdPlaceholder } from "@/components/ads/AdPlaceholder"
import { AdSlot } from "@/components/ads/AdSlot"
import { getAdSlot } from "@/config/ads.config"
import { getActiveAd, getPlacementMeta } from "@/lib/queries/home"
import { cn } from "@/lib/utils"

type Props = {
  /**
   * The placement id to show (e.g. `"home_top"`, `"annonce_sidebar"`).
   * When the id matches a slot in `config/ads.config.ts`, rendering is
   * delegated to the new centralized <AdSlot/> (device-aware, lazy, AdSense
   * fallback). Unknown ids fall back to the legacy DB-only banner below.
   */
  placement?: string
  /** @deprecated Use `placement` instead. Kept for backward compatibility. */
  slug?: string
  /** Legacy: visual height for the placeholder/banner box. */
  heightClass?: string
  /** Legacy: intrinsic ad width in pixels. */
  width?: number
  /** Legacy: intrinsic ad height in pixels. */
  height?: number
  className?: string
}

/**
 * Backward-compatible wrapper around the ad system.
 *
 * New code should use <AdSlot slotId="…" /> directly. This component remains so
 * existing call-sites keep working: when the placement is a known config slot
 * it transparently delegates to <AdSlot/>; otherwise it renders the original
 * DB-driven banner.
 */
export async function AdBanner({
  placement,
  slug,
  heightClass = "h-[150px] md:h-[180px]",
  width,
  height,
  className,
}: Props) {
  const placementSlug = placement ?? slug
  if (!placementSlug) return null

  // Known slot → route through the centralized system.
  if (getAdSlot(placementSlug)) {
    return <AdSlot slotId={placementSlug} className={className} />
  }

  // ---- Legacy path (unknown slots) --------------------------------------
  const [ad, placementMeta, t] = await Promise.all([
    getActiveAd(placementSlug),
    getPlacementMeta(placementSlug),
    getTranslations("ads"),
  ])

  if (placementMeta && !placementMeta.isActive) return null

  const w = width ?? placementMeta?.width ?? null
  const h = height ?? placementMeta?.height ?? null
  const hasDims = !!(w && h)
  const sizeStyle: React.CSSProperties | undefined = hasDims
    ? { aspectRatio: `${w} / ${h}`, maxWidth: `${w}px` }
    : undefined

  if (!ad) {
    return (
      <AdPlaceholder
        label={t("placeholder")}
        heightClass={hasDims ? "" : heightClass}
        style={sizeStyle}
        className={cn(hasDims && "w-full mx-auto", className)}
      />
    )
  }

  return (
    <div
      style={sizeStyle}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl",
        hasDims ? "mx-auto" : heightClass,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute top-2 end-2 z-10 inline-flex items-center rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/90"
      >
        {t("label")}
      </span>
      <AdLink
        adId={ad.id}
        href={ad.link_url}
        title={ad.title}
        className="block size-full"
      >
        <Image
          src={ad.image_url}
          alt={ad.title}
          fill
          sizes="(max-width: 1280px) 100vw, 1200px"
          className="object-cover"
        />
      </AdLink>
    </div>
  )
}

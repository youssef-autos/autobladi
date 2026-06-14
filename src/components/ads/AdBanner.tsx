import Image from "next/image"
import { getTranslations } from "next-intl/server"

import { AdLink } from "@/components/ads/AdLink"
import { AdPlaceholder } from "@/components/ads/AdPlaceholder"
import { getActiveAd, getPlacementMeta } from "@/lib/queries/home"
import { cn } from "@/lib/utils"

type Props = {
  /**
   * The `ad_placements.slug` to show (e.g. `"home_top"`, `"annonce_sidebar"`).
   * Old callsites still use `slug` — both names are accepted to make the
   * migration painless.
   */
  placement?: string
  /** @deprecated Use `placement` instead. Kept for backward compatibility. */
  slug?: string
  /**
   * Visual height for the placeholder/banner box. Defaults to a responsive
   * leaderboard height. Prefer passing explicit `width` / `height` props when
   * you know the placement's intrinsic dimensions.
   */
  heightClass?: string
  /** Intrinsic ad width in pixels (used for Next/Image sizing hints). */
  width?: number
  /** Intrinsic ad height in pixels (used for Next/Image sizing hints). */
  height?: number
  className?: string
}

export async function AdBanner({
  placement,
  slug,
  heightClass = "h-[150px] md:h-[180px]",
  width,
  height,
  className,
}: Props) {
  const placementSlug = placement ?? slug
  if (!placementSlug) {
    // Defensive: misconfigured callsite — render nothing rather than crash.
    return null
  }

  const [ad, placementMeta, t] = await Promise.all([
    getActiveAd(placementSlug),
    getPlacementMeta(placementSlug),
    getTranslations("ads"),
  ])

  // Admin hid this placement → render nothing at all (no ad, no placeholder).
  if (placementMeta && !placementMeta.isActive) {
    return null
  }

  // Prefer explicit props, then the placement's admin-configured dimensions.
  // When known, the slot is sized by aspect-ratio (responsive) and capped at
  // its intrinsic width — so each placement renders proportionally to where it
  // appears on the page. Falls back to `heightClass` when no size is set.
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

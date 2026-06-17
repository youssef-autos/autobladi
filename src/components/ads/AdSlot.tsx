import { getTranslations } from "next-intl/server"

import { AdSlotClient } from "@/components/ads/AdSlotClient"
import { getAdSlotData, getAdsenseClientId } from "@/lib/queries/home"

type Props = {
  /** Slot id from `config/ads.config.ts` (equals the `ad_placements.slug`). */
  slotId: string
  className?: string
}

/**
 * The single, smart entry point for placing an ad anywhere on the site:
 *
 *     <AdSlot slotId="home_top" />
 *
 * All settings (on/off, device, sizes, network, AdSense unit) come from the
 * database (admin-editable), with code defaults as fallback. It also looks up an
 * active direct campaign and hands everything to the client renderer, which
 * decides device/lazy-load/network. Disabled or unknown slots render nothing.
 *
 * This is an async Server Component — wrap it in <Suspense> at the call site if
 * you want a streaming boundary while the lookups resolve.
 */
export async function AdSlot({ slotId, className }: Props) {
  const [data, adsenseClientId, t] = await Promise.all([
    getAdSlotData(slotId),
    getAdsenseClientId(),
    getTranslations("ads"),
  ])

  if (!data) return null

  return (
    <AdSlotClient
      settings={data.settings}
      directAd={data.directAd}
      adsenseClientId={adsenseClientId}
      adsenseEnabled={adsenseClientId.startsWith("ca-pub-")}
      label={t("label")}
      className={className}
    />
  )
}

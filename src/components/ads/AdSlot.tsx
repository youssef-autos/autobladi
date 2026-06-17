import { getTranslations } from "next-intl/server"

import { AdSlotClient } from "@/components/ads/AdSlotClient"
import { getAdSlot } from "@/config/ads.config"
import { getActiveAd } from "@/lib/queries/home"

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
 * It reads the slot definition from the central config, looks up an active
 * direct campaign in the database, and hands both to the client renderer, which
 * decides device/lazy-load/network. Disabled or unknown slots render nothing.
 *
 * This is an async Server Component — wrap it in <Suspense> at the call site if
 * you want a streaming boundary while the direct-campaign lookup resolves.
 */
export async function AdSlot({ slotId, className }: Props) {
  const slot = getAdSlot(slotId)
  if (!slot || !slot.enabled) return null

  const [directAd, t] = await Promise.all([
    // Direct campaigns are keyed by the matching placement slug.
    getActiveAd(slotId),
    getTranslations("ads"),
  ])

  return (
    <AdSlotClient
      slot={slot}
      directAd={directAd}
      label={t("label")}
      className={className}
    />
  )
}

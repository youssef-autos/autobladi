import "server-only"

import { createClient } from "@/lib/supabase/server"
import {
  getAllAdSlots,
  resolveAdSlot,
  type AdSlotOverrides,
} from "@/config/ads.config"
import type { Tables } from "@/types/database.types"

// ---------------------------------------------------------------------------
// Placements — all 15 slots with ad count
// ---------------------------------------------------------------------------
export type AdminPlacementRow = Tables<"ad_placements"> & {
  ads_count: number
}

export async function listAllPlacementsAdmin(): Promise<AdminPlacementRow[]> {
  const supabase = await createClient()
  const { data: placements } = await supabase
    .from("ad_placements")
    .select("*")
    .order("slug", { ascending: true })

  // Count active ads per placement via a compact aggregate
  const { data: counts } = await supabase
    .from("advertisements")
    .select("placement_id")
    .eq("is_active", true)

  const countMap = new Map<string, number>()
  for (const row of (counts ?? []) as Array<{ placement_id: string }>) {
    countMap.set(row.placement_id, (countMap.get(row.placement_id) ?? 0) + 1)
  }

  return ((placements ?? []) as Tables<"ad_placements">[]).map((p) => ({
    ...p,
    ads_count: countMap.get(p.id) ?? 0,
  }))
}

// ---------------------------------------------------------------------------
// Full ad-slot settings for the admin editor — every slot in the config
// registry, merged with its saved DB overrides, plus its active-ad count.
// Driven by the config registry so the list is always the canonical set of
// slots (stray legacy rows in the DB are ignored).
// ---------------------------------------------------------------------------
export type AdSlotSettingsRow = {
  slug: string
  name: string
  is_active: boolean
  device: "mobile" | "desktop" | "both"
  default_provider: "adsense" | "direct"
  width: number
  height: number
  width_mobile: number
  height_mobile: number
  adsense_slot_id: string
  lazy: boolean
  ads_count: number
}

export async function listAdSlotSettings(): Promise<AdSlotSettingsRow[]> {
  const supabase = await createClient()

  const [{ data: rows }, { data: counts }] = await Promise.all([
    supabase.from("ad_placements").select("*"),
    supabase.from("advertisements").select("placement_id").eq("is_active", true),
  ])

  const countMap = new Map<string, number>()
  for (const c of (counts ?? []) as Array<{ placement_id: string }>) {
    countMap.set(c.placement_id, (countMap.get(c.placement_id) ?? 0) + 1)
  }

  const bySlug = new Map<string, { id: string } & AdSlotOverrides>()
  for (const r of (rows ?? []) as Array<{ id: string; slug: string } & AdSlotOverrides>) {
    bySlug.set(r.slug, r)
  }

  return getAllAdSlots().map((slot) => {
    const row = bySlug.get(slot.id)
    const r = resolveAdSlot(slot.id, (row ?? null) as AdSlotOverrides | null)!
    return {
      slug: slot.id,
      name: r.label,
      is_active: r.enabled,
      device: r.device,
      default_provider: r.defaultProvider,
      width: r.sizes.desktop.width,
      height: r.sizes.desktop.height,
      width_mobile: r.sizes.mobile.width,
      height_mobile: r.sizes.mobile.height,
      adsense_slot_id: r.adsenseSlotId,
      lazy: r.lazy,
      ads_count: row ? countMap.get(row.id) ?? 0 : 0,
    }
  })
}

// ---------------------------------------------------------------------------
// Advertisements — all with placement name + slug
// ---------------------------------------------------------------------------
export type AdminAdRow = Tables<"advertisements"> & {
  placement: { id: string; name: string; slug: string; width: number | null; height: number | null } | null
}

type RawAdRow = Tables<"advertisements"> & {
  ad_placements: { id: string; name: string; slug: string; width: number | null; height: number | null } | null
}

export async function listAllAdsAdmin(): Promise<AdminAdRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("advertisements")
    .select(
      `id, placement_id, title, image_url, link_url, starts_at, ends_at,
       is_active, clicks, impressions, created_at,
       ad_placements(id, name, slug, width, height)`,
    )
    .order("created_at", { ascending: false })
  const rows = (data ?? []) as unknown as RawAdRow[]
  return rows.map((r) => ({
    ...r,
    placement: r.ad_placements,
  }))
}

// ---------------------------------------------------------------------------
// Ads Report — aggregated site stats for advertiser pitching
// ---------------------------------------------------------------------------
export type AdsReportData = {
  reach: {
    totalUsers: number
    newUsersThisMonth: number
    totalActiveListings: number
    totalPageViews: number
    newsletterSubscribers: number
    proUsers: number
  }
  monthlyGrowth: { month: string; users: number; listings: number }[]
  topCities: { city: string; count: number }[]
  placementStats: {
    name: string
    slug: string
    impressions: number
    clicks: number
    ctr: number
    activeAds: number
  }[]
}

export async function getAdsReport(): Promise<AdsReportData> {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalUsersRes,
    newUsersRes,
    activeListingsRes,
    newsletterRes,
    proUsersRes,
    viewsRes,
    profileDatesRes,
    listingDatesRes,
    cityRes,
    placementRes,
    adRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("annonces")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("newsletter_subscribed", true),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "pro"),
    supabase.from("annonces").select("views_count").eq("status", "active"),
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString()),
    supabase
      .from("annonces")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString()),
    supabase.from("profiles").select("city").not("city", "is", null),
    supabase.from("ad_placements").select("id, name, slug"),
    supabase
      .from("advertisements")
      .select("placement_id, impressions, clicks, is_active"),
  ])

  const views = (viewsRes.data ?? []) as Array<{ views_count: number }>
  const totalPageViews = views.reduce((sum, r) => sum + (r.views_count ?? 0), 0)

  // Build last-6-months bucket list
  const months: { month: string; users: number; listings: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      users: 0,
      listings: 0,
    })
  }

  for (const r of (profileDatesRes.data ?? []) as Array<{ created_at: string }>) {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const m = months.find((x) => x.month === key)
    if (m) m.users += 1
  }

  for (const r of (listingDatesRes.data ?? []) as Array<{ created_at: string }>) {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const m = months.find((x) => x.month === key)
    if (m) m.listings += 1
  }

  // Top cities by profile count
  const cityCounts = new Map<string, number>()
  for (const r of (cityRes.data ?? []) as Array<{ city: string | null }>) {
    if (!r.city) continue
    cityCounts.set(r.city, (cityCounts.get(r.city) ?? 0) + 1)
  }
  const topCities = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([city, count]) => ({ city, count }))

  // Placement performance
  const placements = (placementRes.data ?? []) as Array<{
    id: string
    name: string
    slug: string
  }>
  const adsByPlacement = new Map<
    string,
    { impressions: number; clicks: number; activeAds: number }
  >()
  for (const a of (adRes.data ?? []) as Array<{
    placement_id: string
    impressions: number
    clicks: number
    is_active: boolean
  }>) {
    const cur = adsByPlacement.get(a.placement_id) ?? {
      impressions: 0,
      clicks: 0,
      activeAds: 0,
    }
    cur.impressions += a.impressions
    cur.clicks += a.clicks
    if (a.is_active) cur.activeAds += 1
    adsByPlacement.set(a.placement_id, cur)
  }

  const placementStats = placements
    .map((p) => {
      const s = adsByPlacement.get(p.id) ?? {
        impressions: 0,
        clicks: 0,
        activeAds: 0,
      }
      return {
        name: p.name,
        slug: p.slug,
        impressions: s.impressions,
        clicks: s.clicks,
        ctr: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0,
        activeAds: s.activeAds,
      }
    })
    .sort((a, b) => b.impressions - a.impressions)

  return {
    reach: {
      totalUsers: totalUsersRes.count ?? 0,
      newUsersThisMonth: newUsersRes.count ?? 0,
      totalActiveListings: activeListingsRes.count ?? 0,
      totalPageViews,
      newsletterSubscribers: newsletterRes.count ?? 0,
      proUsers: proUsersRes.count ?? 0,
    },
    monthlyGrowth: months,
    topCities,
    placementStats,
  }
}

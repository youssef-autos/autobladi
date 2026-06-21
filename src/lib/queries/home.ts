import "server-only"

import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import {
  mergeHomeSections,
  type HomeSectionConfig,
} from "@/lib/home-sections"
import {
  resolveAdSlot,
  type AdSlotOverrides,
  type ResolvedAdSlot,
} from "@/config/ads.config"
import type { Tables } from "@/types/database.types"

export type Brand = Tables<"brands">
export type CarModel = Tables<"car_models">
export type City = Tables<"cities">

export type AnnonceCardData = {
  id: string
  slug: string
  title: string
  year: number | null
  mileage: number | null
  price: number | null
  fuel_type: Tables<"annonces">["fuel_type"]
  transmission: Tables<"annonces">["transmission"]
  condition: Tables<"annonces">["condition"]
  featured: boolean
  published_at: string | null
  main_image: string | null
  image_count: number
  city: { name_ar: string; name_fr: string; slug: string } | null
  brand: { name: string; slug: string; logo_url: string | null } | null
  model: { name: string; slug: string } | null
  seller_name: string | null
  is_pro: boolean
  is_verified: boolean
}

type AnnonceRow = Tables<"annonces"> & {
  annonce_images: Pick<Tables<"annonce_images">, "url" | "is_main" | "order_index">[] | null
  cities: Pick<Tables<"cities">, "name_ar" | "name_fr" | "slug"> | null
  brands: Pick<Tables<"brands">, "name" | "slug" | "logo_url"> | null
  car_models: Pick<Tables<"car_models">, "name" | "slug"> | null
  profiles: Pick<Tables<"profiles">, "full_name" | "account_type" | "is_verified"> | null
}

function mapAnnonce(row: AnnonceRow): AnnonceCardData {
  const images = row.annonce_images ?? []
  const main = images.find((i) => i.is_main) ?? images[0] ?? null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    year: row.year,
    mileage: row.mileage,
    price: row.price,
    fuel_type: row.fuel_type,
    transmission: row.transmission,
    condition: row.condition,
    featured: row.featured,
    published_at: row.published_at,
    main_image: main?.url ?? null,
    image_count: images.length,
    city: row.cities,
    brand: row.brands,
    model: row.car_models,
    seller_name: row.profiles?.full_name ?? null,
    is_pro: row.profiles?.account_type === "pro" || row.profiles?.account_type === "admin",
    is_verified: row.profiles?.is_verified ?? false,
  }
}

const annonceSelect = `
  id, slug, title, year, mileage, price, fuel_type, transmission, condition, featured, published_at,
  annonce_images(url, is_main, order_index),
  cities(name_ar, name_fr, slug),
  brands(name, slug, logo_url),
  car_models(name, slug),
  profiles(full_name, account_type, is_verified)
` as const

export async function getFeaturedAnnonces(limit = 4): Promise<AnnonceCardData[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(annonceSelect)
    .eq("status", "active")
    .eq("featured", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)
  return (data ?? []).map((r) => mapAnnonce(r as unknown as AnnonceRow))
}

export async function getLatestAnnonces(limit = 8): Promise<AnnonceCardData[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(annonceSelect)
    .eq("status", "active")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)
  return (data ?? []).map((r) => mapAnnonce(r as unknown as AnnonceRow))
}

export type DealerCardData = Pick<
  Tables<"professionnels">,
  "id" | "name" | "slug" | "logo_url" | "cover_url" | "rating" | "reviews_count"
> & {
  city: { name_ar: string; name_fr: string } | null
  annonces_count: number
  is_verified: boolean
}

type DealerRow = {
  id: string
  user_id: string
  name: string
  slug: string
  logo_url: string | null
  cover_url: string | null
  rating: number
  reviews_count: number
  cities: { name_ar: string; name_fr: string } | null
  profiles: { is_verified: boolean } | null
}

export async function getTopDealers(limit = 6): Promise<DealerCardData[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("professionnels")
    .select(
      `id, user_id, name, slug, logo_url, cover_url, rating, reviews_count,
       cities(name_ar, name_fr),
       profiles(is_verified)`,
    )
    .eq("is_active", true)
    .order("rating", { ascending: false })
    .order("reviews_count", { ascending: false })
    .limit(limit)

  const rows = (data ?? []) as unknown as DealerRow[]

  // Active-annonce count per dealer (by owner).
  const ids = rows.map((r) => r.user_id)
  let countsByUser = new Map<string, number>()
  if (ids.length > 0) {
    const { data: countRows } = await supabase
      .from("annonces")
      .select("user_id")
      .in("user_id", ids)
      .eq("status", "active")
    const annonceRows = (countRows ?? []) as unknown as Array<{ user_id: string }>
    countsByUser = annonceRows.reduce((m, r) => {
      m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1)
      return m
    }, new Map<string, number>())
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo_url: row.logo_url,
    cover_url: row.cover_url,
    rating: row.rating,
    reviews_count: row.reviews_count,
    city: row.cities,
    annonces_count: countsByUser.get(row.user_id) ?? 0,
    is_verified: row.profiles?.is_verified ?? false,
  }))
}

export type BlogPostCardData = Pick<
  Tables<"blog_posts">,
  "id" | "title" | "slug" | "excerpt" | "cover_image" | "published_at"
> & {
  category: { name_ar: string; name_fr: string; slug: string } | null
}

type BlogPostRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  published_at: string | null
  blog_categories: { name_ar: string; name_fr: string; slug: string } | null
}

export async function getLatestBlogPosts(limit = 3): Promise<BlogPostCardData[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select(
      `id, title, slug, excerpt, cover_image, published_at,
       blog_categories(name_ar, name_fr, slug)`,
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)

  const rows = (data ?? []) as unknown as BlogPostRow[]
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    cover_image: row.cover_image,
    published_at: row.published_at,
    category: row.blog_categories,
  }))
}

export type AdvertisementData = Pick<
  Tables<"advertisements">,
  "id" | "title" | "image_url" | "link_url"
>

type AdRow = {
  id: string
  title: string
  image_url: string
  link_url: string | null
}

export async function getActiveAd(placementSlug: string): Promise<AdvertisementData | null> {
  const supabase = await createClient()

  // Step 1 — resolve the placement to its ID and confirm it's visible.
  // Using a plain single-table query (no embedded join filter) avoids the
  // PostgREST behaviour where .eq("related.column") silently returns no rows.
  const { data: placement } = await supabase
    .from("ad_placements")
    .select("id, is_active")
    .eq("slug", placementSlug)
    .maybeSingle<{ id: string; is_active: boolean }>()

  if (!placement || !placement.is_active) return null

  // Step 2 — find an active, in-schedule ad for that placement.
  const now = new Date().toISOString()
  const { data } = await supabase
    .from("advertisements")
    .select("id, title, image_url, link_url")
    .eq("placement_id", placement.id)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .limit(1)
    .maybeSingle<{ id: string; title: string; image_url: string; link_url: string | null }>()

  if (!data) return null
  return {
    id: data.id,
    title: data.title,
    image_url: data.image_url,
    link_url: data.link_url,
  }
}

/**
 * A placement's admin-configured metadata: its intrinsic dimensions (used by
 * AdBanner to size the slot proportionally) and whether it's visible at all.
 * `isActive` is false when the admin has hidden the placement from the site —
 * AdBanner then renders nothing (not even a placeholder). Returns null when the
 * placement slug doesn't exist.
 */
export async function getPlacementMeta(slug: string): Promise<{
  width: number | null
  height: number | null
  isActive: boolean
  device: "mobile" | "desktop" | "both"
} | null> {
  const supabase = await createClient()

  // Try with device column first (requires migration 035).
  // If it fails (column not yet added), fall back to the base columns.
  const { data, error } = await supabase
    .from("ad_placements")
    .select("width, height, is_active, device")
    .eq("slug", slug)
    .maybeSingle()

  if (!error && data) {
    const row = data as { width: number | null; height: number | null; is_active: boolean; device?: string }
    return {
      width: row.width,
      height: row.height,
      isActive: row.is_active,
      device: (row.device ?? "both") as "mobile" | "desktop" | "both",
    }
  }

  // Fallback — device column missing, select without it.
  const { data: data2 } = await supabase
    .from("ad_placements")
    .select("width, height, is_active")
    .eq("slug", slug)
    .maybeSingle<{ width: number | null; height: number | null; is_active: boolean }>()

  if (!data2) return null
  return {
    width: data2.width,
    height: data2.height,
    isActive: data2.is_active,
    device: "both",
  }
}

/**
 * Everything <AdSlot/> needs for a slug in one place: the fully-resolved slot
 * settings (DB row merged over code defaults) plus the active direct campaign
 * (if any). Returns null when the slot is unknown or disabled — the component
 * then renders nothing.
 *
 * `select("*")` is used (not an explicit column list) so this keeps working
 * even before migration 036 adds the new columns — missing columns simply fall
 * back to the code defaults via resolveAdSlot().
 */
export async function getAdSlotData(slug: string): Promise<{
  settings: ResolvedAdSlot
  directAd: AdvertisementData | null
} | null> {
  const supabase = await createClient()

  const { data: row } = await supabase
    .from("ad_placements")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  const settings = resolveAdSlot(slug, (row ?? null) as AdSlotOverrides | null)
  if (!settings || !settings.enabled) return null

  // Active direct campaign for this placement (date-windowed).
  let directAd: AdvertisementData | null = null
  const placementId = (row as { id?: string } | null)?.id
  if (placementId) {
    const now = new Date().toISOString()
    const { data: ad } = await supabase
      .from("advertisements")
      .select("id, title, image_url, link_url")
      .eq("placement_id", placementId)
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .limit(1)
      .maybeSingle<{ id: string; title: string; image_url: string; link_url: string | null }>()
    if (ad) {
      directAd = {
        id: ad.id,
        title: ad.title,
        image_url: ad.image_url,
        link_url: ad.link_url,
      }
    }
  }

  return { settings, directAd }
}

/**
 * The Google AdSense publisher id (e.g. "ca-pub-1234…"). Admin-editable from
 * the dashboard (stored in the public `site_settings` table — it is NOT a
 * secret), falling back to the build-time env var. Empty string when unset, in
 * which case AdSense is disabled site-wide. Cached per request.
 */
export const getAdsenseClientId = cache(async (): Promise<string> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "adsense_client_id")
    .maybeSingle<{ value: unknown }>()
  const fromDb = typeof data?.value === "string" ? data.value.trim() : ""
  return fromDb || (process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "").trim()
})

/**
 * Returns the admin-uploaded logos:
 * - `light`: for light/white backgrounds (header, nav, mobile menu)
 * - `dark`: for dark backgrounds (footer)
 * Falls back to the legacy single `site_logo_url`, then null (shows text wordmark).
 */
export async function getSiteLogos(): Promise<{ light: string | null; dark: string | null }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["site_logo_url_light", "site_logo_url_dark", "site_logo_url"])
  const rows = (data ?? []) as Array<{ key: string; value: unknown }>
  const pick = (k: string): string | null => {
    const v = rows.find((r) => r.key === k)?.value
    return typeof v === "string" && v.trim() ? v : null
  }
  const legacy = pick("site_logo_url")
  return {
    light: pick("site_logo_url_light") ?? legacy,
    dark: pick("site_logo_url_dark") ?? legacy,
  }
}

/**
 * The admin-uploaded favicon URL, or null when unset (the site then falls back
 * to the static app/icon.tsx + favicon.ico).
 */
export async function getSiteFaviconUrl(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site_favicon_url")
    .maybeSingle<{ value: unknown }>()
  const v = data?.value
  return typeof v === "string" && v.trim() ? v : null
}

/**
 * Admin-entered search-engine site-verification codes (Google Search Console +
 * Bing Webmaster). These are public values meant for the page <head>, so they
 * live in the public-read site_settings. Empty when unset.
 */
export async function getSiteVerification(): Promise<{
  google: string | null
  bing: string | null
  yandex: string | null
  pinterest: string | null
  customHead: string | null
}> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [
      "google_site_verification",
      "bing_site_verification",
      "yandex_verification",
      "pinterest_verification",
      "custom_head_code",
    ])
  const rows = (data ?? []) as Array<{ key: string; value: unknown }>
  const pick = (k: string): string | null => {
    const v = rows.find((r) => r.key === k)?.value
    return typeof v === "string" && v.trim() ? v.trim() : null
  }
  return {
    google: pick("google_site_verification"),
    bing: pick("bing_site_verification"),
    yandex: pick("yandex_verification"),
    pinterest: pick("pinterest_verification"),
    customHead: pick("custom_head_code"),
  }
}

/**
 * Admin-entered Google Analytics measurement ID (e.g. "G-XXXXXXXXXX").
 * Returns null when unset — layout skips injecting the gtag script.
 */
export async function getSiteAnalyticsId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "google_analytics_id")
    .maybeSingle<{ value: unknown }>()
  const v = data?.value
  return typeof v === "string" && v.trim() ? v.trim() : null
}

// ---------------------------------------------------------------------------
// Home sections layout (admin-managed visibility + order)
// ---------------------------------------------------------------------------
export async function getHomeSectionsConfig(): Promise<HomeSectionConfig[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "home_sections")
    .maybeSingle<{ value: unknown }>()
  return mergeHomeSections(data?.value)
}

/**
 * Real platform counts for the hero (active annonces + active dealers).
 * Cheap COUNT(*) head queries — no rows transferred.
 */
export async function getHomeCounts(): Promise<{
  annonces: number
  dealers: number
  cities: number
}> {
  const supabase = await createClient()
  const [annoncesRes, dealersRes, cityRows] = await Promise.all([
    supabase
      .from("annonces")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("professionnels")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    // Distinct cities that actually have an active listing.
    supabase
      .from("annonces")
      .select("city_id")
      .eq("status", "active")
      .not("city_id", "is", null),
  ])
  const citySet = new Set(
    ((cityRows.data ?? []) as Array<{ city_id: string | null }>)
      .map((r) => r.city_id)
      .filter(Boolean),
  )
  return {
    annonces: annoncesRes.count ?? 0,
    dealers: dealersRes.count ?? 0,
    cities: citySet.size,
  }
}

export async function getActiveBrands(limit = 50): Promise<Brand[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("brands")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true })
    .limit(limit)
  return data ?? []
}

export async function getActiveModels(): Promise<CarModel[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("car_models")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
  return data ?? []
}

export async function getCities(): Promise<City[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("cities")
    .select("*")
    .order("name_fr", { ascending: true })
  return data ?? []
}

export type Secteur = {
  id: string
  city_id: string
  name_ar: string
  name_fr: string
  slug: string
}

/**
 * All secteurs across all cities. Small dataset — fine to fetch once
 * and filter client-side in the sidebar by the selected city/cities.
 */
export async function getSecteurs(): Promise<Secteur[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("secteurs")
    .select("id, city_id, name_ar, name_fr, slug")
    .order("name_fr", { ascending: true })
  return (data ?? []) as Secteur[]
}


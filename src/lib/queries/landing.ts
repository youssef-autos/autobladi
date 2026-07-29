import "server-only"

import { createClient } from "@/lib/supabase/server"
import { mediaUrl } from "@/lib/media"
import type { AnnoncesFilters } from "@/components/annonces/searchParams"

export type LandingBrand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

export type LandingCity = {
  id: string
  name_ar: string
  name_fr: string
  slug: string
}

/** Active brand by slug, or null. */
export async function getBrandBySlug(slug: string): Promise<LandingBrand | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<LandingBrand>()
  if (!data) return null
  return { ...data, logo_url: mediaUrl(data.logo_url) }
}

/** City by slug, or null. */
export async function getCityBySlug(slug: string): Promise<LandingCity | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("cities")
    .select("id, name_ar, name_fr, slug")
    .eq("slug", slug)
    .maybeSingle<LandingCity>()
  return data ?? null
}

export type LandingModel = { id: string; name: string; slug: string }

/** Active model by (brand, slug), or null. */
export async function getModelBySlug(
  brandId: string,
  slug: string,
): Promise<LandingModel | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("car_models")
    .select("id, name, slug")
    .eq("brand_id", brandId)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<LandingModel>()
  return data ?? null
}

/** Cities that actually have active listings for a brand (and optional model) —
 *  used for internal linking so we never link to empty pages. */
export async function getCitiesWithListings(
  opts: { brandId: string; modelId?: string },
  limit = 12,
): Promise<LandingCity[]> {
  const supabase = await createClient()
  let query = supabase
    .from("annonces")
    .select("cities!inner(id, name_ar, name_fr, slug)")
    .eq("status", "active")
    .eq("brand_id", opts.brandId)
    .not("city_id", "is", null)
    .limit(500)
  if (opts.modelId) query = query.eq("model_id", opts.modelId)
  const { data } = await query
  const rows = (data ?? []) as unknown as Array<{ cities: LandingCity | null }>
  const seen = new Map<string, LandingCity>()
  for (const r of rows) {
    if (r.cities && !seen.has(r.cities.id)) seen.set(r.cities.id, r.cities)
  }
  return Array.from(seen.values()).slice(0, limit)
}

/** Back-compat wrapper for brand pages. */
export function getCitiesWithListingsForBrand(
  brandId: string,
  limit = 12,
): Promise<LandingCity[]> {
  return getCitiesWithListings({ brandId }, limit)
}

export type LandingBrandRef = { id: string; name: string; slug: string }

/** Brands that have active listings in a city — used to cross-link a city hub
 *  to its brand×city pages (never linking to empty pages). */
export async function getBrandsWithListingsInCity(
  cityId: string,
  limit = 16,
): Promise<LandingBrandRef[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select("brands!inner(id, name, slug)")
    .eq("status", "active")
    .eq("city_id", cityId)
    .limit(500)
  const rows = (data ?? []) as unknown as Array<{ brands: LandingBrandRef | null }>
  const seen = new Map<string, LandingBrandRef>()
  for (const r of rows) {
    if (r.brands && !seen.has(r.brands.id)) seen.set(r.brands.id, r.brands)
  }
  return Array.from(seen.values()).slice(0, limit)
}

/**
 * A full AnnoncesFilters object (all defaults) pre-set to an optional brand
 * and/or city, so the SEO landing pages can reuse `searchAnnonces`.
 */
export function landingFilters(opts: {
  brand?: string
  model?: string
  city?: string
  page?: number
}): AnnoncesFilters {
  return {
    q: "",
    condition: null,
    brand: opts.brand ? [opts.brand] : [],
    model: opts.model ? [opts.model] : [],
    city: opts.city ? [opts.city] : [],
    secteur: [],
    priceMin: null,
    priceMax: null,
    yearMin: null,
    yearMax: null,
    mileageMin: null,
    mileageMax: null,
    fuel: [],
    transmission: null,
    color: "",
    doors: [],
    options: [],
    sort: "newest",
    view: "grid",
    page: opts.page ?? 1,
  }
}

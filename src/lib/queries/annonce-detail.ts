import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { AnnonceCardData } from "@/lib/queries/home"
import type { Tables } from "@/types/database.types"

export type AnnonceImage = {
  id: string
  url: string
  thumbnail_url: string | null
  order_index: number
  is_main: boolean
}

export type AnnonceDetail = {
  id: string
  slug: string
  title: string
  description: string | null
  year: number | null
  mileage: number | null
  price: number | null
  fuel_type: Tables<"annonces">["fuel_type"]
  transmission: Tables<"annonces">["transmission"]
  body_type: string | null
  origine: string | null
  color: string | null
  doors: number | null
  seats: number | null
  engine_power: number | null
  engine_size: string | null
  first_owner: boolean | null
  accident_free: boolean | null
  condition: Tables<"annonces">["condition"]
  options: string[]
  contact_phone: string | null
  contact_whatsapp: string | null
  video_url: string | null
  status: Tables<"annonces">["status"]
  views_count: number
  featured: boolean
  published_at: string | null
  created_at: string
  brand_id: string | null
  images: AnnonceImage[]
  brand: { id: string; name: string; slug: string; logo_url: string | null } | null
  model: { id: string; name: string; slug: string } | null
  city: { id: string; name_ar: string; name_fr: string; slug: string } | null
  seller: {
    id: string
    full_name: string | null
    avatar_url: string | null
    account_type: Tables<"profiles">["account_type"]
    is_verified: boolean
    created_at: string
  } | null
}

type AnnonceDetailRow = Tables<"annonces"> & {
  annonce_images: AnnonceImage[] | null
  brands: { id: string; name: string; slug: string; logo_url: string | null } | null
  car_models: { id: string; name: string; slug: string } | null
  cities: { id: string; name_ar: string; name_fr: string; slug: string } | null
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
    account_type: Tables<"profiles">["account_type"]
    is_verified: boolean
    created_at: string
  } | null
}

const detailSelect = `
  *,
  annonce_images(id, url, thumbnail_url, order_index, is_main),
  brands(id, name, slug, logo_url),
  car_models(id, name, slug),
  cities(id, name_ar, name_fr, slug),
  profiles(id, full_name, avatar_url, account_type, is_verified, created_at)
` as const

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string")
  }
  return []
}

function mapDetail(row: AnnonceDetailRow): AnnonceDetail {
  const images = (row.annonce_images ?? [])
    .slice()
    .sort((a, b) => {
      if (a.is_main && !b.is_main) return -1
      if (!a.is_main && b.is_main) return 1
      return a.order_index - b.order_index
    })

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    year: row.year,
    mileage: row.mileage,
    price: row.price,
    fuel_type: row.fuel_type,
    transmission: row.transmission,
    body_type: row.body_type,
    origine: row.origine,
    color: row.color,
    doors: row.doors,
    seats: row.seats,
    engine_power: row.engine_power,
    engine_size: row.engine_size,
    first_owner: row.first_owner,
    accident_free: row.accident_free,
    condition: row.condition,
    options: asStringArray(row.options),
    contact_phone: row.contact_phone,
    contact_whatsapp: row.contact_whatsapp,
    video_url: row.video_url,
    status: row.status,
    views_count: row.views_count,
    featured: row.featured,
    published_at: row.published_at,
    created_at: row.created_at,
    brand_id: row.brand_id,
    images,
    brand: row.brands,
    model: row.car_models,
    city: row.cities,
    seller: row.profiles,
  }
}

export async function getAnnonceBySlug(slug: string): Promise<AnnonceDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(detailSelect)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()
  if (!data) return null
  return mapDetail(data as unknown as AnnonceDetailRow)
}

type SimilarRow = Tables<"annonces"> & {
  annonce_images: { url: string; is_main: boolean; order_index: number }[] | null
  cities: { name_ar: string; name_fr: string; slug: string } | null
  brands: { name: string; slug: string; logo_url: string | null } | null
  car_models: { name: string; slug: string } | null
  profiles: { full_name: string | null; account_type: Tables<"profiles">["account_type"]; is_verified: boolean } | null
}

function mapSimilar(row: SimilarRow): AnnonceCardData {
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

export async function getSimilarAnnonces(
  source: AnnonceDetail,
  limit = 4,
): Promise<AnnonceCardData[]> {
  const supabase = await createClient()

  let query = supabase
    .from("annonces")
    .select(
      `id, slug, title, year, mileage, price, fuel_type, transmission, condition, featured, published_at,
       annonce_images(url, is_main, order_index),
       cities(name_ar, name_fr, slug),
       brands(name, slug, logo_url),
       car_models(name, slug),
       profiles(full_name, account_type, is_verified)`,
    )
    .eq("status", "active")
    .neq("id", source.id)
    .limit(limit)

  // Prefer same brand for similar cars
  if (source.brand_id) {
    query = query.eq("brand_id", source.brand_id)
  }

  // ±25% price band when price known
  if (source.price && source.price > 0) {
    query = query.gte("price", source.price * 0.75).lte("price", source.price * 1.25)
  }

  query = query.order("featured", { ascending: false }).order("published_at", {
    ascending: false,
    nullsFirst: false,
  })

  const { data } = await query
  const rows = (data ?? []) as unknown as SimilarRow[]
  return rows.map(mapSimilar)
}

export async function countOtherAnnoncesByUser(
  userId: string,
  excludeId: string,
): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("annonces")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active")
    .neq("id", excludeId)
  return count ?? 0
}

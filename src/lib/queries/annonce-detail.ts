import "server-only"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import {
  ANNONCE_CARD_SELECT,
  mapAnnonceCard,
  type AnnonceCardData,
  type AnnonceCardRow,
} from "@/lib/queries/annonce-card"
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
  price_on_request: boolean
  negotiable: boolean
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
    created_at: string
  } | null
}

const detailSelect = `
  *,
  annonce_images(id, url, thumbnail_url, order_index, is_main),
  brands(id, name, slug, logo_url),
  car_models(id, name, slug),
  cities(id, name_ar, name_fr, slug),
  profiles(id, full_name, avatar_url, account_type, created_at)
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
    // Nulled here (not just hidden client-side) so it never reaches the
    // client payload, page metadata, JSON-LD, or OG image when hidden — every
    // downstream consumer (AnnonceHeader, generateMetadata, vehicleSchema,
    // opengraph-image) reads this same sanitized object.
    price: row.price_on_request ? null : row.price,
    price_on_request: row.price_on_request,
    negotiable: row.negotiable,
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

// Wrapped in React.cache() — generateMetadata and the page body both call
// this for the same slug on every request; caching dedupes the DB round-trip.
export const getAnnonceBySlug = cache(async function getAnnonceBySlug(
  slug: string,
): Promise<AnnonceDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(detailSelect)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()
  if (!data) return null
  return mapDetail(data as unknown as AnnonceDetailRow)
})

export async function getSimilarAnnonces(
  source: AnnonceDetail,
  limit = 4,
): Promise<AnnonceCardData[]> {
  const supabase = await createClient()

  let query = supabase
    .from("annonces")
    .select(ANNONCE_CARD_SELECT)
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

  query = query.order("published_at", { ascending: false, nullsFirst: false })

  const { data } = await query
  const rows = (data ?? []) as unknown as AnnonceCardRow[]
  return rows.map(mapAnnonceCard)
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

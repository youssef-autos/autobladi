import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"
import type { OpeningHoursMap } from "@/lib/validations/professionnel"
import {
  ANNONCE_CARD_SELECT,
  mapAnnonceCard,
  type AnnonceCardRow,
} from "@/lib/queries/annonce-card"

export type ProfessionnelListItem = {
  id: string
  user_id: string
  name: string
  slug: string
  logo_url: string | null
  cover_url: string | null
  description: string | null
  rating: number
  reviews_count: number
  is_active: boolean
  is_pro: boolean
  city: { name_ar: string; name_fr: string; slug: string } | null
  annonces_count: number
  created_at: string
}

type ListRow = Tables<"professionnels"> & {
  cities: { name_ar: string; name_fr: string; slug: string } | null
  profiles: {
    account_type: Tables<"profiles">["account_type"]
  } | null
}

type ProfessionnelListFilters = {
  q?: string
  city?: string
  minRating?: number
  sort?: "popular" | "rating" | "newest"
  page?: number
  pageSize?: number
}

export type ProfessionnelListResult = {
  items: ProfessionnelListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const DEFAULT_PAGE_SIZE = 12

export async function listProfessionnels(
  filters: ProfessionnelListFilters = {},
): Promise<ProfessionnelListResult> {
  const supabase = await createClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let cityId: string | null = null
  if (filters.city) {
    const { data: c } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", filters.city)
      .maybeSingle<{ id: string }>()
    cityId = c?.id ?? null
  }

  let query = supabase
    .from("professionnels")
    .select(
      `id, user_id, name, slug, logo_url, cover_url, description, rating,
       reviews_count, is_active, created_at,
       cities(name_ar, name_fr, slug),
       profiles(account_type)`,
      { count: "exact" },
    )
    .eq("is_active", true)

  if (filters.q) query = query.ilike("name", `%${filters.q}%`)
  if (cityId) query = query.eq("city_id", cityId)
  if (filters.minRating != null && filters.minRating > 0) {
    query = query.gte("rating", filters.minRating)
  }

  switch (filters.sort) {
    case "rating":
      query = query.order("rating", { ascending: false }).order("reviews_count", {
        ascending: false,
      })
      break
    case "newest":
      query = query.order("created_at", { ascending: false })
      break
    default:
      query = query.order("reviews_count", { ascending: false }).order("rating", {
        ascending: false,
      })
  }
  query = query.range(from, to)

  const { data, count } = await query
  const rows = (data ?? []) as unknown as ListRow[]
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

  const items: ProfessionnelListItem[] = rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    slug: row.slug,
    logo_url: row.logo_url,
    cover_url: row.cover_url,
    description: row.description,
    rating: row.rating,
    reviews_count: row.reviews_count,
    is_active: row.is_active,
    is_pro:
      row.profiles?.account_type === "pro" ||
      row.profiles?.account_type === "admin",
    city: row.cities,
    annonces_count: countsByUser.get(row.user_id) ?? 0,
    created_at: row.created_at,
  }))

  const total = count ?? 0
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export type ProfessionnelDetail = {
  id: string
  user_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  address: string | null
  secteur_id: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  facebook: string | null
  instagram: string | null
  youtube: string | null
  tiktok: string | null
  linkedin: string | null
  opening_hours: OpeningHoursMap | null
  rating: number
  reviews_count: number
  is_active: boolean
  is_verified: boolean
  created_at: string
  city: { id: string; name_ar: string; name_fr: string; slug: string } | null
  secteur: { id: string; name_ar: string; name_fr: string; slug: string } | null
  annonces_count: number
  owner: {
    id: string
    full_name: string | null
    account_type: Tables<"profiles">["account_type"]
  } | null
}

type DetailRow = Tables<"professionnels"> & {
  cities: { id: string; name_ar: string; name_fr: string; slug: string } | null
  secteurs: { id: string; name_ar: string; name_fr: string; slug: string } | null
  profiles: {
    id: string
    full_name: string | null
    account_type: Tables<"profiles">["account_type"]
  } | null
}

export async function getProfessionnelBySlug(
  slug: string,
): Promise<ProfessionnelDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("professionnels")
    .select(
      `*,
       cities(id, name_ar, name_fr, slug),
       secteurs(id, name_ar, name_fr, slug),
       profiles(id, full_name, account_type)`,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()

  if (!data) return null
  const row = data as unknown as DetailRow

  // Active annonces count
  const { count } = await supabase
    .from("annonces")
    .select("id", { count: "exact", head: true })
    .eq("user_id", row.user_id)
    .eq("status", "active")

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logo_url: row.logo_url,
    cover_url: row.cover_url,
    address: row.address,
    secteur_id: row.secteur_id,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    website: row.website,
    facebook: row.facebook,
    instagram: row.instagram,
    youtube: row.youtube,
    tiktok: row.tiktok,
    linkedin: row.linkedin,
    opening_hours: (row.opening_hours as OpeningHoursMap | null) ?? null,
    rating: row.rating,
    reviews_count: row.reviews_count,
    is_active: row.is_active,
    is_verified: row.is_verified,
    created_at: row.created_at,
    city: row.cities,
    secteur: row.secteurs,
    annonces_count: count ?? 0,
    owner: row.profiles,
  }
}

/**
 * The active showroom (professionnel) owned by a given user, or null. Used on
 * the annonce detail page to link a professional seller to their showroom.
 */
export async function getShowroomByUserId(
  userId: string,
): Promise<{ slug: string; name: string } | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("professionnels")
    .select("slug, name")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle<{ slug: string; name: string }>()
  return data ?? null
}

export async function getMyProfessionnel(): Promise<ProfessionnelDetail | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("professionnels")
    .select(
      `*,
       cities(id, name_ar, name_fr, slug),
       secteurs(id, name_ar, name_fr, slug),
       profiles(id, full_name, account_type)`,
    )
    .eq("user_id", user.id)
    .maybeSingle()

  if (!data) return null
  const row = data as unknown as DetailRow
  const { count } = await supabase
    .from("annonces")
    .select("id", { count: "exact", head: true })
    .eq("user_id", row.user_id)
    .eq("status", "active")

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logo_url: row.logo_url,
    cover_url: row.cover_url,
    address: row.address,
    secteur_id: row.secteur_id,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    website: row.website,
    facebook: row.facebook,
    instagram: row.instagram,
    youtube: row.youtube,
    tiktok: row.tiktok,
    linkedin: row.linkedin,
    opening_hours: (row.opening_hours as OpeningHoursMap | null) ?? null,
    rating: row.rating,
    reviews_count: row.reviews_count,
    is_active: row.is_active,
    is_verified: row.is_verified,
    created_at: row.created_at,
    city: row.cities,
    secteur: row.secteurs,
    annonces_count: count ?? 0,
    owner: row.profiles,
  }
}

export type ReviewItem = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user: { id: string; full_name: string | null; avatar_url: string | null }
}

type ReviewRow = Tables<"professionnel_reviews"> & {
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export async function listReviews(
  professionnelId: string,
  limit = 20,
): Promise<ReviewItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("professionnel_reviews")
    .select(`id, rating, comment, created_at,
             profiles(id, full_name, avatar_url)`)
    .eq("professionnel_id", professionnelId)
    .order("created_at", { ascending: false })
    .limit(limit)

  const rows = (data ?? []) as unknown as ReviewRow[]
  return rows
    .filter((r) => r.profiles != null)
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      user: r.profiles!,
    }))
}

export async function getMyReviewFor(
  professionnelId: string,
): Promise<ReviewItem | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("professionnel_reviews")
    .select(`id, rating, comment, created_at,
             profiles(id, full_name, avatar_url)`)
    .eq("professionnel_id", professionnelId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!data) return null
  const row = data as unknown as ReviewRow
  if (!row.profiles) return null
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    created_at: row.created_at,
    user: row.profiles,
  }
}

export async function listProfessionnelAnnonces(userId: string) {
  // We don't expose an owner filter on searchAnnonces yet — do an inline query.
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(ANNONCE_CARD_SELECT)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(48)

  const rows = (data ?? []) as unknown as AnnonceCardRow[]
  return rows.map(mapAnnonceCard)
}

import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"

// ---------------------------------------------------------------------------
// Showrooms — admin list joined with city + owner + annonces count
// ---------------------------------------------------------------------------
export type AdminShowroomRow = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  rating: number
  reviews_count: number
  is_active: boolean
  is_verified: boolean
  created_at: string
  city: { name_ar: string; name_fr: string } | null
  owner: { id: string; full_name: string | null; avatar_url: string | null } | null
  annonces_count: number
}

type RawShowroom = Tables<"showrooms"> & {
  cities: { name_ar: string; name_fr: string } | null
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export async function listAllShowroomsAdmin(): Promise<
  AdminShowroomRow[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("showrooms")
    .select(`
      id, user_id, name, slug, logo_url, rating, reviews_count, is_active, is_verified, created_at,
      cities(name_ar, name_fr),
      profiles(id, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
  const rows = (data ?? []) as unknown as RawShowroom[]

  // Count active annonces per owner (showrooms & annonces both key on user_id)
  const { data: annonceRows } = await supabase
    .from("annonces")
    .select("user_id")
    .eq("status", "active")
  const countMap = new Map<string, number>()
  for (const a of (annonceRows ?? []) as Array<{ user_id: string | null }>) {
    if (!a.user_id) continue
    countMap.set(a.user_id, (countMap.get(a.user_id) ?? 0) + 1)
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    logo_url: r.logo_url,
    rating: r.rating,
    reviews_count: r.reviews_count,
    is_active: r.is_active,
    is_verified: r.is_verified,
    created_at: r.created_at,
    city: r.cities,
    owner: r.profiles,
    annonces_count: countMap.get(r.user_id) ?? 0,
  }))
}

// ---------------------------------------------------------------------------
// Showrooms awaiting approval — lightweight list for the dashboard widget
// ---------------------------------------------------------------------------
export type PendingShowroomRow = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  city: { name_ar: string; name_fr: string } | null
  owner: { id: string; full_name: string | null; avatar_url: string | null } | null
}

type RawPendingShowroom = Pick<
  Tables<"showrooms">,
  "id" | "name" | "slug" | "logo_url" | "created_at"
> & {
  cities: { name_ar: string; name_fr: string } | null
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export async function listPendingShowroomsAdmin(
  limit = 5,
): Promise<PendingShowroomRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("showrooms")
    .select(`
      id, name, slug, logo_url, created_at,
      cities(name_ar, name_fr),
      profiles(id, full_name, avatar_url)
    `)
    .eq("is_active", false)
    .order("created_at", { ascending: false })
    .limit(limit)
  const rows = (data ?? []) as unknown as RawPendingShowroom[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    logo_url: r.logo_url,
    created_at: r.created_at,
    city: r.cities,
    owner: r.profiles,
  }))
}

// ---------------------------------------------------------------------------
// Showroom reviews — moderation (admins may delete abusive reviews)
// ---------------------------------------------------------------------------
export type AdminReviewRow = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  dealer: { id: string; name: string; slug: string; logo_url: string | null } | null
  author: { id: string; full_name: string | null; avatar_url: string | null } | null
}

type RawReviewRow = Tables<"showroom_reviews"> & {
  showrooms: { id: string; name: string; slug: string; logo_url: string | null } | null
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export async function listReviewsAdmin(): Promise<AdminReviewRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("showroom_reviews")
    .select(`
      id, rating, comment, created_at,
      showrooms(id, name, slug, logo_url),
      profiles!user_id(id, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
  if (error) console.error("[listReviewsAdmin]", error.message)
  const rows = (data ?? []) as unknown as RawReviewRow[]
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    dealer: r.showrooms,
    author: r.profiles,
  }))
}

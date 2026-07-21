import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"
import { mapAnnonceCard, type AnnonceCardRow } from "@/lib/queries/annonce-card"

export type DashboardProfile = Pick<
  Tables<"profiles">,
  | "id"
  | "full_name"
  | "phone"
  | "whatsapp"
  | "avatar_url"
  | "account_type"
  | "city"
>

export async function getCurrentProfile(): Promise<DashboardProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, whatsapp, avatar_url, account_type, city",
    )
    .eq("id", user.id)
    .maybeSingle<DashboardProfile>()
  return data ?? null
}

export type DashboardStats = {
  totalAnnonces: number
  activeAnnonces: number
  totalViews: number
  unreadMessages: number
  favoritesReceived: number
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient()

  const [annoncesResult, activeResult, viewsResult, messagesResult, favsResult] =
    await Promise.all([
      supabase
        .from("annonces")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("annonces")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase
        .from("annonces")
        .select("views_count")
        .eq("user_id", userId),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("is_read", false),
      // Count favorites where the annonce belongs to this user
      supabase
        .from("favorites")
        .select("id, annonces!inner(user_id)", { count: "exact", head: true })
        .eq("annonces.user_id", userId),
    ])

  const viewsRows = (viewsResult.data ?? []) as unknown as Array<{
    views_count: number
  }>
  const totalViews = viewsRows.reduce((sum, r) => sum + (r.views_count ?? 0), 0)

  return {
    totalAnnonces: annoncesResult.count ?? 0,
    activeAnnonces: activeResult.count ?? 0,
    totalViews,
    unreadMessages: messagesResult.count ?? 0,
    favoritesReceived: favsResult.count ?? 0,
  }
}

export type ChartPoint = { name: string; views: number }

type TopAnnonceRow = {
  id: string
  title: string
  views_count: number
}

export async function getTopAnnoncesByViews(
  userId: string,
  limit = 10,
): Promise<ChartPoint[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select("id, title, views_count")
    .eq("user_id", userId)
    .order("views_count", { ascending: false })
    .limit(limit)
  const rows = (data ?? []) as unknown as TopAnnonceRow[]
  return rows
    .filter((r) => r.views_count > 0)
    .map((r) => ({ name: r.title.slice(0, 24), views: r.views_count }))
}

export type ExpiringAnnonceRow = {
  id: string
  slug: string
  title: string
  expires_at: string
}

export async function getExpiringAnnonces(
  userId: string,
  withinDays = 5,
): Promise<ExpiringAnnonceRow[]> {
  const supabase = await createClient()
  const now = new Date()
  const future = new Date(now.getTime() + withinDays * 86_400_000)
  const { data } = await supabase
    .from("annonces")
    .select("id, slug, title, expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .gte("expires_at", now.toISOString())
    .lte("expires_at", future.toISOString())
    .order("expires_at", { ascending: true })
  return (data ?? []) as unknown as ExpiringAnnonceRow[]
}

export type DashboardAnnonceRow = {
  id: string
  slug: string
  title: string
  price: number | null
  status: Tables<"annonces">["status"]
  views_count: number
  published_at: string | null
  created_at: string
  expires_at: string | null
  main_image: string | null
}

type ListRow = Tables<"annonces"> & {
  annonce_images: { url: string; is_main: boolean; order_index: number }[] | null
}

export async function listMyAnnonces(userId: string): Promise<DashboardAnnonceRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(`
      id, slug, title, price, status, views_count, published_at, created_at,
      expires_at,
      annonce_images(url, is_main, order_index)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const rows = (data ?? []) as unknown as ListRow[]
  return rows.map((row) => {
    const images = row.annonce_images ?? []
    const main = images.find((i) => i.is_main) ?? images[0] ?? null
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      price: row.price,
      status: row.status,
      views_count: row.views_count,
      published_at: row.published_at,
      created_at: row.created_at,
      expires_at: row.expires_at,
      main_image: main?.url ?? null,
    }
  })
}

type FavoriteRow = {
  id: string
  annonce_id: string
  created_at: string
  annonces: Tables<"annonces"> & {
    annonce_images: { url: string; is_main: boolean; order_index: number }[] | null
    cities: { name_ar: string; name_fr: string; slug: string } | null
    brands: { name: string; slug: string; logo_url: string | null } | null
    car_models: { name: string; slug: string } | null
    profiles: { full_name: string | null; account_type: string } | null
  }
}

export async function listMyFavorites(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("favorites")
    .select(`
      id, annonce_id, created_at,
      annonces(
        id, slug, title, year, mileage, price, price_on_request, negotiable, fuel_type, transmission, condition, published_at, status,
        annonce_images(url, is_main, order_index),
        cities(name_ar, name_fr, slug),
        brands(name, slug, logo_url),
        car_models(name, slug),
        profiles(full_name, account_type)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const rows = (data ?? []) as unknown as FavoriteRow[]
  return rows
    .filter((r) => r.annonces && r.annonces.status === "active")
    .map((r) => ({
      favoriteId: r.id,
      annonce: mapAnnonceCard(r.annonces as unknown as AnnonceCardRow),
    }))
}

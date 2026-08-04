import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { AnnonceStatus, Tables } from "@/types/database.types"

// ---------------------------------------------------------------------------
// Pending annonces queue
// ---------------------------------------------------------------------------
export type PendingAnnonceRow = {
  id: string
  slug: string
  title: string
  price: number | null
  created_at: string
  main_image: string | null
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
    account_type: Tables<"profiles">["account_type"]
  } | null
  brand: { name: string } | null
  model: { name: string } | null
  city: { name_ar: string; name_fr: string } | null
}

type RawPendingAnnonce = Tables<"annonces"> & {
  annonce_images: { url: string; is_main: boolean; order_index: number }[] | null
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
    account_type: Tables<"profiles">["account_type"]
  } | null
  brands: { name: string } | null
  car_models: { name: string } | null
  cities: { name_ar: string; name_fr: string } | null
}

export async function listPendingAnnonces(): Promise<PendingAnnonceRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(`
      id, slug, title, price, created_at,
      annonce_images(url, is_main, order_index),
      profiles(id, full_name, avatar_url, account_type),
      brands(name),
      car_models(name),
      cities(name_ar, name_fr)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
  const rows = (data ?? []) as unknown as RawPendingAnnonce[]
  return rows.map((r) => {
    const images = r.annonce_images ?? []
    const main = images.find((i) => i.is_main) ?? images[0] ?? null
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      price: r.price,
      created_at: r.created_at,
      main_image: main?.url ?? null,
      user: r.profiles,
      brand: r.brands,
      model: r.car_models,
      city: r.cities,
    }
  })
}

// ---------------------------------------------------------------------------
// All annonces — admin management table (every status, newest first)
// ---------------------------------------------------------------------------
export type AdminAnnonceRow = {
  id: string
  slug: string
  title: string
  price: number | null
  status: AnnonceStatus
  views_count: number
  created_at: string
  main_image: string | null
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
    account_type: Tables<"profiles">["account_type"]
  } | null
  brand: { name: string } | null
  model: { name: string } | null
  city: { name_ar: string; name_fr: string } | null
}

type RawAdminAnnonce = Tables<"annonces"> & {
  annonce_images: { url: string; is_main: boolean; order_index: number }[] | null
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
    account_type: Tables<"profiles">["account_type"]
  } | null
  brands: { name: string } | null
  car_models: { name: string } | null
  cities: { name_ar: string; name_fr: string } | null
}

export async function listAllAnnoncesAdmin(
  limit = 300,
): Promise<AdminAnnonceRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(`
      id, slug, title, price, status, views_count, created_at,
      annonce_images(url, is_main, order_index),
      profiles(id, full_name, avatar_url, account_type),
      brands(name),
      car_models(name),
      cities(name_ar, name_fr)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)
  const rows = (data ?? []) as unknown as RawAdminAnnonce[]
  return rows.map((r) => {
    const images = r.annonce_images ?? []
    const main = images.find((i) => i.is_main) ?? images[0] ?? null
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      price: r.price,
      status: r.status,
      views_count: r.views_count,
      created_at: r.created_at,
      main_image: main?.url ?? null,
      user: r.profiles,
      brand: r.brands,
      model: r.car_models,
      city: r.cities,
    }
  })
}

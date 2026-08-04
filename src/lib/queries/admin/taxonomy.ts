import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { mediaUrl } from "@/lib/media"
import type { Tables } from "@/types/database.types"

// ---------------------------------------------------------------------------
// Cities — admin list (no pagination; ~50 rows total expected)
// ---------------------------------------------------------------------------
export type AdminCityRow = Tables<"cities">

export async function listAllCitiesAdmin(): Promise<AdminCityRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("cities")
    .select("*")
    .order("name_fr", { ascending: true })
  return (data ?? []) as AdminCityRow[]
}

// ---------------------------------------------------------------------------
// Brands — admin list (sorted by manual order_index, ~50-100 rows expected)
// ---------------------------------------------------------------------------
export type AdminBrandRow = Tables<"brands">

export async function listAllBrandsAdmin(): Promise<AdminBrandRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("brands")
    .select("*")
    .order("order_index", { ascending: true })
    .order("name", { ascending: true })
  return ((data ?? []) as AdminBrandRow[]).map((b) => ({
    ...b,
    logo_url: mediaUrl(b.logo_url),
  }))
}

// ---------------------------------------------------------------------------
// Models — admin list joined with brand for display (brand name + slug).
// ---------------------------------------------------------------------------
export type AdminModelRow = Tables<"car_models"> & {
  brand: { id: string; name: string; slug: string; logo_url: string | null } | null
}

type RawModelRow = Tables<"car_models"> & {
  brands: { id: string; name: string; slug: string; logo_url: string | null } | null
}

export async function listAllModelsAdmin(): Promise<AdminModelRow[]> {
  const supabase = createAdminClient()
  // PostgREST caps each response at max_rows (default 1000) regardless of
  // .limit(). Paginate in 1000-row chunks until we exhaust the table.
  const PAGE = 1000
  const allRows: RawModelRow[] = []
  let page = 0

  for (;;) {
    const from = page * PAGE
    const { data } = await supabase
      .from("car_models")
      .select(
        `id, brand_id, name, slug, is_active, created_at,
         brands(id, name, slug, logo_url)`,
      )
      .order("name", { ascending: true })
      .range(from, from + PAGE - 1)
    const chunk = (data ?? []) as unknown as RawModelRow[]
    allRows.push(...chunk)
    if (chunk.length < PAGE) break
    page++
  }

  return allRows.map((r) => ({
    id: r.id,
    brand_id: r.brand_id,
    name: r.name,
    slug: r.slug,
    is_active: r.is_active,
    created_at: r.created_at,
    brand: r.brands,
  }))
}

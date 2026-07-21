import "server-only"

import { createClient } from "@/lib/supabase/server"
import {
  ANNONCE_CARD_SELECT,
  mapAnnonceCard,
  type AnnonceCardData,
  type AnnonceCardRow,
} from "@/lib/queries/annonce-card"
import type { AnnoncesFilters } from "@/components/annonces/searchParams"
import { PAGE_SIZE } from "@/components/annonces/searchParams"

export type AnnoncesListResult = {
  annonces: AnnonceCardData[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

async function resolveSlugsToIds(
  table: "brands" | "car_models" | "cities",
  slugs: string[],
): Promise<string[]> {
  if (slugs.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from(table)
    .select("id, slug")
    .in("slug", slugs)
  const rows = (data ?? []) as unknown as Array<{ id: string; slug: string }>
  return rows.map((r) => r.id)
}

const SORT_MAP = {
  newest: { col: "published_at", asc: false },
  priceAsc: { col: "price", asc: true },
  priceDesc: { col: "price", asc: false },
  mileageAsc: { col: "mileage", asc: true },
} as const

export async function searchAnnonces(
  filters: AnnoncesFilters,
): Promise<AnnoncesListResult> {
  const supabase = await createClient()
  const page = Math.max(1, filters.page)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const secteurSlugs = filters.secteur ?? []

  const [brandIds, modelIds, cityIds, secteurIds] = await Promise.all([
    resolveSlugsToIds("brands", filters.brand),
    resolveSlugsToIds("car_models", filters.model),
    resolveSlugsToIds("cities", filters.city),
    // secteurs has a composite unique key (city_id, slug) — query directly
    secteurSlugs.length > 0
      ? supabase
          .from("secteurs")
          .select("id, slug")
          .in("slug", secteurSlugs)
          .then(({ data }) =>
            ((data ?? []) as Array<{ id: string; slug: string }>).map((r) => r.id),
          )
      : Promise.resolve([] as string[]),
  ])

  let query = supabase
    .from("annonces")
    .select(ANNONCE_CARD_SELECT, { count: "exact" })
    .eq("status", "active")

  if (filters.q) query = query.ilike("title", `%${filters.q}%`)
  if (filters.condition) query = query.eq("condition", filters.condition)
  if (filters.transmission) query = query.eq("transmission", filters.transmission)
  if (filters.color) query = query.ilike("color", `%${filters.color}%`)

  if (brandIds.length) query = query.in("brand_id", brandIds)
  if (modelIds.length) query = query.in("model_id", modelIds)
  if (cityIds.length) query = query.in("city_id", cityIds)
  if (secteurIds.length) query = query.in("secteur_id", secteurIds)
  if (filters.fuel.length) query = query.in("fuel_type", filters.fuel)
  if (filters.doors.length) query = query.in("doors", filters.doors)

  if (filters.priceMin != null) query = query.gte("price", filters.priceMin)
  if (filters.priceMax != null) query = query.lte("price", filters.priceMax)
  if (filters.yearMin != null) query = query.gte("year", filters.yearMin)
  if (filters.yearMax != null) query = query.lte("year", filters.yearMax)
  if (filters.mileageMin != null) query = query.gte("mileage", filters.mileageMin)
  if (filters.mileageMax != null) query = query.lte("mileage", filters.mileageMax)

  // options is a jsonb array; require all selected options to be present
  if (filters.options.length) {
    query = query.contains("options", filters.options)
  }

  const sort = SORT_MAP[filters.sort]
  query = query.order(sort.col, { ascending: sort.asc, nullsFirst: false })
  query = query.range(from, to)

  const { data, count } = await query
  const rows = (data ?? []) as unknown as AnnonceCardRow[]
  const annonces = rows.map(mapAnnonceCard)
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return { annonces, total, page, pageSize: PAGE_SIZE, totalPages }
}

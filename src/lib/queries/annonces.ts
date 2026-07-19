import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { AnnonceCardData } from "@/lib/queries/home"
import type { AnnoncesFilters } from "@/components/annonces/searchParams"
import { PAGE_SIZE } from "@/components/annonces/searchParams"
import type { Tables } from "@/types/database.types"

type AnnonceRow = Tables<"annonces"> & {
  annonce_images: Pick<Tables<"annonce_images">, "url" | "is_main" | "order_index">[] | null
  cities: Pick<Tables<"cities">, "name_ar" | "name_fr" | "slug"> | null
  brands: Pick<Tables<"brands">, "name" | "slug" | "logo_url"> | null
  car_models: Pick<Tables<"car_models">, "name" | "slug"> | null
  profiles: Pick<Tables<"profiles">, "full_name" | "account_type"> | null
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
    published_at: row.published_at,
    main_image: main?.url ?? null,
    image_count: images.length,
    city: row.cities,
    brand: row.brands,
    model: row.car_models,
    seller_name: row.profiles?.full_name ?? null,
    is_pro:
      row.profiles?.account_type === "pro" || row.profiles?.account_type === "admin",
  }
}

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

  const select = `
    id, slug, title, year, mileage, price, fuel_type, transmission, condition, published_at,
    annonce_images(url, is_main, order_index),
    cities(name_ar, name_fr, slug),
    brands(name, slug, logo_url),
    car_models(name, slug),
    profiles(full_name, account_type)
  `

  let query = supabase
    .from("annonces")
    .select(select, { count: "exact" })
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
  const rows = (data ?? []) as unknown as AnnonceRow[]
  const annonces = rows.map(mapAnnonce)
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return { annonces, total, page, pageSize: PAGE_SIZE, totalPages }
}

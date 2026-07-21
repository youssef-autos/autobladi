import type { Tables } from "@/types/database.types"

/**
 * Shared shape for every "annonce card" surface: home latest listings, the
 * /annonces search results, similar-cars, and a dealer's showroom listing.
 * One mapper here instead of one per query module.
 */
export type AnnonceCardData = {
  id: string
  slug: string
  title: string
  year: number | null
  mileage: number | null
  price: number | null
  price_on_request: boolean
  negotiable: boolean
  fuel_type: Tables<"annonces">["fuel_type"]
  transmission: Tables<"annonces">["transmission"]
  condition: Tables<"annonces">["condition"]
  published_at: string | null
  main_image: string | null
  image_count: number
  city: { name_ar: string; name_fr: string; slug: string } | null
  brand: { name: string; slug: string; logo_url: string | null } | null
  model: { name: string; slug: string } | null
  seller_name: string | null
  is_pro: boolean
}

export type AnnonceCardRow = Tables<"annonces"> & {
  annonce_images: Pick<Tables<"annonce_images">, "url" | "is_main" | "order_index">[] | null
  cities: Pick<Tables<"cities">, "name_ar" | "name_fr" | "slug"> | null
  brands: Pick<Tables<"brands">, "name" | "slug" | "logo_url"> | null
  car_models: Pick<Tables<"car_models">, "name" | "slug"> | null
  profiles: Pick<Tables<"profiles">, "full_name" | "account_type"> | null
}

/** Select fragment matching `AnnonceCardRow` — pass to `.select()`. */
export const ANNONCE_CARD_SELECT = `
  id, slug, title, year, mileage, price, price_on_request, negotiable, fuel_type, transmission, condition, published_at,
  annonce_images(url, is_main, order_index),
  cities(name_ar, name_fr, slug),
  brands(name, slug, logo_url),
  car_models(name, slug),
  profiles(full_name, account_type)
` as const

export function mapAnnonceCard(row: AnnonceCardRow): AnnonceCardData {
  const images = row.annonce_images ?? []
  const main = images.find((i) => i.is_main) ?? images[0] ?? null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    year: row.year,
    mileage: row.mileage,
    // The real number never reaches public-facing pages when hidden — never
    // just toggled client-side, or it'd still leak via view-source/devtools.
    price: row.price_on_request ? null : row.price,
    price_on_request: row.price_on_request,
    negotiable: row.negotiable,
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
    is_pro: row.profiles?.account_type === "pro" || row.profiles?.account_type === "admin",
  }
}

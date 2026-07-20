"use server"

import { createClient } from "@/lib/supabase/server"

export type CompareCar = {
  id: string
  slug: string
  title: string
  main_image: string | null
  price: number | null
  price_on_request: boolean
  year: number | null
  mileage: number | null
  fuel_type: string | null
  transmission: string | null
  condition: string | null
  color: string | null
  doors: number | null
  seats: number | null
  engine_power: number | null
  engine_size: number | null
  origine: string | null
  first_owner: boolean | null
  accident_free: boolean | null
  brand: { name: string; slug: string } | null
  model: { name: string; slug: string } | null
  city: { name_ar: string; name_fr: string } | null
}

type RawRow = {
  id: string
  slug: string
  title: string
  price: number | null
  price_on_request: boolean
  year: number | null
  mileage: number | null
  fuel_type: string | null
  transmission: string | null
  condition: string | null
  color: string | null
  doors: number | null
  seats: number | null
  engine_power: number | null
  engine_size: number | null
  origine: string | null
  first_owner: boolean | null
  accident_free: boolean | null
  annonce_images: { url: string; is_main: boolean; order_index: number }[] | null
  brands: { name: string; slug: string } | null
  car_models: { name: string; slug: string } | null
  cities: { name_ar: string; name_fr: string } | null
}

// Fetches active annonces by slug for the comparison table. Returns them in
// the same order as the requested slugs. Input is untrusted (localStorage).
export async function fetchCompareAnnonces(
  input: unknown,
): Promise<CompareCar[]> {
  if (!Array.isArray(input)) return []
  const slugs = input
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .slice(0, 4)
  if (slugs.length === 0) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(`
      id, slug, title, price, price_on_request, year, mileage, fuel_type, transmission, condition,
      color, doors, seats, engine_power, engine_size, origine, first_owner, accident_free,
      annonce_images(url, is_main, order_index),
      brands(name, slug),
      car_models(name, slug),
      cities(name_ar, name_fr)
    `)
    .in("slug", slugs)
    .eq("status", "active")

  const rows = (data ?? []) as unknown as RawRow[]
  const mapped: CompareCar[] = rows.map((r) => {
    const images = r.annonce_images ?? []
    const main = images.find((i) => i.is_main) ?? images[0] ?? null
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      main_image: main?.url ?? null,
      price: r.price_on_request ? null : r.price,
      price_on_request: r.price_on_request,
      year: r.year,
      mileage: r.mileage,
      fuel_type: r.fuel_type,
      transmission: r.transmission,
      condition: r.condition,
      color: r.color,
      doors: r.doors,
      seats: r.seats,
      engine_power: r.engine_power,
      engine_size: r.engine_size,
      origine: r.origine,
      first_owner: r.first_owner,
      accident_free: r.accident_free,
      brand: r.brands,
      model: r.car_models,
      city: r.cities,
    }
  })

  // Preserve the requested order.
  const bySlug = new Map(mapped.map((c) => [c.slug, c]))
  return slugs.map((s) => bySlug.get(s)).filter((c): c is CompareCar => !!c)
}

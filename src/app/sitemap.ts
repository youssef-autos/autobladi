import type { MetadataRoute } from "next"

import { createClient } from "@/lib/supabase/server"

export const revalidate = 3600 // 1 hour

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"
const LOCALES = ["ar", "fr"] as const
const STATIC_PATHS = [
  "",
  "/annonces",
  "/professionnels",
  "/estimation",
  "/blog",
] as const

type EntryOpts = {
  path: string // without locale prefix, e.g. "/blog/foo" ("" = home)
  lastModified?: Date
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority?: number
}

/**
 * One `<url>` per locale, each carrying the full hreflang set (ar + fr +
 * x-default) so search engines serve the right language version and the
 * copies don't compete. x-default points at Arabic (the default locale).
 */
function entriesFor({
  path,
  lastModified = new Date(),
  changeFrequency = "weekly",
  priority = 0.5,
}: EntryOpts): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {
    ar: `${SITE_URL}/ar${path}`,
    fr: `${SITE_URL}/fr${path}`,
    "x-default": `${SITE_URL}/ar${path}`,
  }
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }))
}

/**
 * Generates the site's XML sitemap. We hit Supabase for the dynamic
 * branches (annonces, professionnels, blog posts, blog categories) and
 * combine them with the static top-level pages — each with hreflang.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const now = new Date()

  const staticEntries = STATIC_PATHS.flatMap((path) =>
    entriesFor({
      path,
      lastModified: now,
      changeFrequency: "daily",
      priority: path === "" ? 1 : 0.8,
    }),
  )

  // Blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(1000)
  type PostRow = { slug: string; updated_at: string; published_at: string | null }
  const blogEntries = ((posts ?? []) as unknown as PostRow[]).flatMap((p) =>
    entriesFor({
      path: `/blog/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.published_at ?? now),
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  )

  // Blog categories
  const { data: cats } = await supabase.from("blog_categories").select("slug")
  type CatRow = { slug: string }
  const catEntries = ((cats ?? []) as unknown as CatRow[]).flatMap((c) =>
    entriesFor({
      path: `/blog/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    }),
  )

  // Active annonces
  const { data: annonces } = await supabase
    .from("annonces")
    .select("slug, updated_at")
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(5000)
  type AnnonceRow = { slug: string; updated_at: string }
  const annonceEntries = ((annonces ?? []) as unknown as AnnonceRow[]).flatMap(
    (a) =>
      entriesFor({
        path: `/annonces/${a.slug}`,
        lastModified: new Date(a.updated_at ?? now),
        changeFrequency: "weekly",
        priority: 0.5,
      }),
  )

  // Professionnels
  const { data: dealers } = await supabase
    .from("professionnels")
    .select("slug, updated_at")
    .eq("is_active", true)
  type DealerRow = { slug: string; updated_at: string }
  const dealerEntries = ((dealers ?? []) as unknown as DealerRow[]).flatMap((d) =>
    entriesFor({
      path: `/professionnel/${d.slug}`,
      lastModified: new Date(d.updated_at ?? now),
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  )

  // SEO landing pages: brand + brand×city — only combos with active listings
  // (so we never list an empty page).
  const { data: combos } = await supabase
    .from("annonces")
    .select("brands(slug), car_models(slug), cities(slug)")
    .eq("status", "active")
    .limit(5000)
  type Combo = {
    brands: { slug: string } | null
    car_models: { slug: string } | null
    cities: { slug: string } | null
  }
  const brandSlugs = new Set<string>()
  const citySlugs = new Set<string>()
  const brandCity = new Set<string>()
  const brandModel = new Set<string>()
  const brandModelCity = new Set<string>()
  for (const r of (combos ?? []) as unknown as Combo[]) {
    const b = r.brands?.slug
    const m = r.car_models?.slug
    const c = r.cities?.slug
    if (c) citySlugs.add(c)
    if (!b) continue
    brandSlugs.add(b)
    if (c) brandCity.add(`${b}/${c}`)
    if (m) {
      brandModel.add(`${b}/modele/${m}`)
      if (c) brandModelCity.add(`${b}/modele/${m}/${c}`)
    }
  }
  const brandEntries = [...brandSlugs].flatMap((b) =>
    entriesFor({ path: `/marques/${b}`, changeFrequency: "daily", priority: 0.7 }),
  )
  const brandCityEntries = [...brandCity].flatMap((p) =>
    entriesFor({ path: `/marques/${p}`, changeFrequency: "weekly", priority: 0.6 }),
  )
  const brandModelEntries = [...brandModel].flatMap((p) =>
    entriesFor({ path: `/marques/${p}`, changeFrequency: "weekly", priority: 0.6 }),
  )
  const brandModelCityEntries = [...brandModelCity].flatMap((p) =>
    entriesFor({ path: `/marques/${p}`, changeFrequency: "weekly", priority: 0.5 }),
  )
  const cityEntries = [...citySlugs].flatMap((c) =>
    entriesFor({ path: `/villes/${c}`, changeFrequency: "daily", priority: 0.7 }),
  )

  return [
    ...staticEntries,
    ...blogEntries,
    ...catEntries,
    ...annonceEntries,
    ...dealerEntries,
    ...brandEntries,
    ...brandCityEntries,
    ...brandModelEntries,
    ...brandModelCityEntries,
    ...cityEntries,
  ]
}

import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"

export type ContentPage = Tables<"pages">

export type FooterPageLink = {
  slug: string
  title_fr: string
  title_ar: string
}

// Published pages flagged for the footer "Société" column.
export async function listFooterPages(): Promise<FooterPageLink[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("pages")
    .select("slug, title_fr, title_ar")
    .eq("is_published", true)
    .eq("show_in_footer", true)
    .order("order_index", { ascending: true })
  return (data ?? []) as FooterPageLink[]
}

export async function getPageBySlug(slug: string): Promise<ContentPage | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()
  return (data as ContentPage | null) ?? null
}

// Slugs of every published page — used by the sitemap / static generation.
export async function listPublishedPageSlugs(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("pages")
    .select("slug")
    .eq("is_published", true)
  return ((data ?? []) as Array<{ slug: string }>).map((r) => r.slug)
}

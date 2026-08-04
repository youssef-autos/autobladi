import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"

// ---------------------------------------------------------------------------
// CMS content pages — admin CRUD
// ---------------------------------------------------------------------------
export type AdminPageRow = Pick<
  Tables<"pages">,
  | "id"
  | "slug"
  | "title_fr"
  | "title_ar"
  | "is_published"
  | "show_in_footer"
  | "order_index"
  | "updated_at"
>

export async function listPagesAdmin(): Promise<AdminPageRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pages")
    .select(
      "id, slug, title_fr, title_ar, is_published, show_in_footer, order_index, updated_at",
    )
    .order("order_index", { ascending: true })
  if (error) console.error("[listPagesAdmin]", error.message)
  return (data ?? []) as AdminPageRow[]
}

export async function getPageAdmin(id: string): Promise<Tables<"pages"> | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  return (data as Tables<"pages"> | null) ?? null
}

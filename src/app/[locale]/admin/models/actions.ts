"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  modelSchema,
  modelUpdateSchema,
  modelImportItemSchema,
  slugify,
} from "@/lib/validations/model"

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function ensureAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  if (profile?.account_type !== "admin") return null
  return { supabase, adminId: user.id }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createModel(input: unknown): Promise<ActionResult> {
  const parsed = modelSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("car_models").insert(parsed.data as never)
  if (error) {
    // UNIQUE (brand_id, slug) violation
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    if (error.code === "23503") return { ok: false, error: "brand_not_found" }
    return { ok: false, error: error.message }
  }
  revalidatePath("/admin/models")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export async function updateModel(input: unknown): Promise<ActionResult> {
  const parsed = modelUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const { id, ...rest } = parsed.data
  const admin = createAdminClient()
  const { error } = await admin
    .from("car_models")
    .update(rest as never)
    .eq("id", id)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    if (error.code === "23503") return { ok: false, error: "brand_not_found" }
    return { ok: false, error: error.message }
  }
  revalidatePath("/admin/models")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Toggle active
// ---------------------------------------------------------------------------
const toggleSchema = z.object({ id: z.uuid(), is_active: z.boolean() })

export async function toggleModelActive(
  input: unknown,
): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("car_models")
    .update({ is_active: parsed.data.is_active } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/models")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export async function deleteModel(id: unknown): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("car_models").delete().eq("id", parsed.data)
  if (error) {
    if (error.code === "23503") return { ok: false, error: "model_in_use" }
    return { ok: false, error: error.message }
  }
  revalidatePath("/admin/models")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Bulk import — resolves brand_slug → brand_id, skips unknown brands.
// ---------------------------------------------------------------------------
export type ImportResult = {
  imported: number
  updated: number
  skipped: number
}

const importSchema = z.array(modelImportItemSchema).min(1).max(5000)

export async function bulkImportModels(
  items: unknown,
): Promise<ActionResult<ImportResult>> {
  const parsed = importSchema.safeParse(items)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()

  // Resolve every distinct brand_slug → brand_id in one query.
  const brandSlugs = Array.from(
    new Set(parsed.data.map((m) => m.brand_slug.trim())),
  )
  const { data: brandsData } = await admin
    .from("brands")
    .select("id, slug")
    .in("slug", brandSlugs)
  type BrandLookup = { id: string; slug: string }
  const brandIdBySlug = new Map(
    ((brandsData ?? []) as BrandLookup[]).map((b) => [b.slug, b.id]),
  )

  // Build the upsertable rows; track which brand_slugs weren't found so
  // we can report `skipped` to the admin instead of silently dropping them.
  let skipped = 0
  type Row = {
    brand_id: string
    name: string
    slug: string
    is_active: boolean
  }
  const rows: Row[] = []
  for (const item of parsed.data) {
    const brandId = brandIdBySlug.get(item.brand_slug.trim())
    if (!brandId) {
      skipped += 1
      continue
    }
    rows.push({
      brand_id: brandId,
      name: item.name.trim(),
      slug: item.slug?.trim() || slugify(item.name),
      is_active: item.is_active ?? true,
    })
  }

  if (rows.length === 0) {
    return { ok: true, data: { imported: 0, updated: 0, skipped } }
  }

  // Find which (brand_id, slug) pairs already exist so we can report
  // imported vs. updated separately.
  const orFilters = rows
    .map((r) => `and(brand_id.eq.${r.brand_id},slug.eq.${r.slug})`)
    .join(",")
  const { data: existing } = await admin
    .from("car_models")
    .select("brand_id, slug")
    .or(orFilters)
  type ExistingRow = { brand_id: string; slug: string }
  const existingKeys = new Set(
    ((existing ?? []) as ExistingRow[]).map((e) => `${e.brand_id}|${e.slug}`),
  )

  // Upsert on the composite unique constraint (brand_id, slug).
  const { error } = await admin
    .from("car_models")
    .upsert(rows as never, { onConflict: "brand_id,slug" })
  if (error) return { ok: false, error: error.message }

  const imported = rows.filter(
    (r) => !existingKeys.has(`${r.brand_id}|${r.slug}`),
  ).length
  const updated = rows.length - imported

  revalidatePath("/admin/models")
  return { ok: true, data: { imported, updated, skipped } }
}

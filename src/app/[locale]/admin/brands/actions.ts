"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  brandSchema,
  brandUpdateSchema,
  brandImportItemSchema,
  slugify,
  type BrandImportItem,
} from "@/lib/validations/brand"

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
export async function createBrand(input: unknown): Promise<ActionResult> {
  const parsed = brandSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("brands").insert(parsed.data as never)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  revalidatePath("/admin/brands")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export async function updateBrand(input: unknown): Promise<ActionResult> {
  const parsed = brandUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const { id, ...rest } = parsed.data
  const admin = createAdminClient()
  const { error } = await admin
    .from("brands")
    .update(rest as never)
    .eq("id", id)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  revalidatePath("/admin/brands")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Toggle active — inline button on the row
// ---------------------------------------------------------------------------
const toggleSchema = z.object({ id: z.uuid(), is_active: z.boolean() })

export async function toggleBrandActive(
  input: unknown,
): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("brands")
    .update({ is_active: parsed.data.is_active } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/brands")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export async function deleteBrand(id: unknown): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("brands").delete().eq("id", parsed.data)
  if (error) {
    // FK violation — brand referenced by car_models or annonces
    if (error.code === "23503") return { ok: false, error: "brand_in_use" }
    return { ok: false, error: error.message }
  }
  revalidatePath("/admin/brands")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Bulk import — upsert on slug
// ---------------------------------------------------------------------------
export type ImportResult = {
  imported: number
  updated: number
}

const importSchema = z.array(brandImportItemSchema).min(1).max(2000)

export async function bulkImportBrands(
  items: unknown,
): Promise<ActionResult<ImportResult>> {
  const parsed = importSchema.safeParse(items)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()

  // Normalize: derive slug from name if missing, default is_active=true.
  const rows: BrandImportItem[] = parsed.data.map((b) => ({
    name: b.name.trim(),
    slug: b.slug?.trim() || slugify(b.name),
    logo_url: b.logo_url ?? null,
    order_index: b.order_index ?? 0,
    is_active: b.is_active ?? true,
  }))

  const slugs = rows.map((r) => r.slug!).filter(Boolean) as string[]
  const { data: existing } = await admin
    .from("brands")
    .select("slug")
    .in("slug", slugs)
  const existingSet = new Set(
    ((existing ?? []) as Array<{ slug: string }>).map((e) => e.slug),
  )

  const { error } = await admin
    .from("brands")
    .upsert(rows as never, { onConflict: "slug" })
  if (error) return { ok: false, error: error.message }

  const imported = rows.filter((r) => !existingSet.has(r.slug!)).length
  const updated = rows.length - imported

  revalidatePath("/admin/brands")
  return { ok: true, data: { imported, updated } }
}

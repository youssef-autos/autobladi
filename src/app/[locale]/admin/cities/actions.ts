"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  citySchema,
  cityUpdateSchema,
  cityImportItemSchema,
  slugify,
  type CityImportItem,
} from "@/lib/validations/city"

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
export async function createCity(input: unknown): Promise<ActionResult> {
  const parsed = citySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("cities").insert(parsed.data as never)
  if (error) {
    // Unique violation on slug → friendlier error
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  revalidatePath("/admin/cities")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export async function updateCity(input: unknown): Promise<ActionResult> {
  const parsed = cityUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const { id, ...rest } = parsed.data
  const admin = createAdminClient()
  const { error } = await admin
    .from("cities")
    .update(rest as never)
    .eq("id", id)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  revalidatePath("/admin/cities")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export async function deleteCity(id: unknown): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("cities").delete().eq("id", parsed.data)
  if (error) {
    // FK violation — city referenced by annonces/profiles
    if (error.code === "23503") return { ok: false, error: "city_in_use" }
    return { ok: false, error: error.message }
  }
  revalidatePath("/admin/cities")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Bulk import (JSON file content already parsed on the client)
// ---------------------------------------------------------------------------
export type ImportResult = {
  imported: number
  updated: number
  errors: string[]
}

const importSchema = z.array(cityImportItemSchema).min(1).max(1000)

export async function bulkImportCities(
  items: unknown,
): Promise<ActionResult<ImportResult>> {
  const parsed = importSchema.safeParse(items)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()

  // Normalize: derive slug from name_fr if missing, null-coalesce region.
  const rows: CityImportItem[] = parsed.data.map((c) => ({
    name_ar: c.name_ar.trim(),
    name_fr: c.name_fr.trim(),
    slug: c.slug?.trim() || slugify(c.name_fr),
    region: c.region?.trim() || null,
  }))

  // Find which slugs already exist so we can report imported vs. updated.
  const slugs = rows.map((r) => r.slug!).filter(Boolean) as string[]
  const { data: existing } = await admin
    .from("cities")
    .select("slug")
    .in("slug", slugs)
  const existingSet = new Set(
    ((existing ?? []) as Array<{ slug: string }>).map((e) => e.slug),
  )

  // Upsert on slug — preserves ids for existing rows.
  const { error } = await admin
    .from("cities")
    .upsert(rows as never, { onConflict: "slug" })
  if (error) return { ok: false, error: error.message }

  const imported = rows.filter((r) => !existingSet.has(r.slug!)).length
  const updated = rows.length - imported

  revalidatePath("/admin/cities")
  return { ok: true, data: { imported, updated, errors: [] } }
}

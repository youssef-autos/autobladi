"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  adSchema,
  adUpdateSchema,
  placementUpdateSchema,
  placementVisibilitySchema,
} from "@/lib/validations/ad"

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
  return { supabase }
}

// ---------------------------------------------------------------------------
// Upload ad image to the 'ads' bucket (public).
// We accept the raw base64 data-URL from the client and decode it server-
// side with the service-role client — admins bypass the RLS INSERT policy
// via service role.
// ---------------------------------------------------------------------------
export async function uploadAdImage(
  dataUrl: string,
  fileName: string,
): Promise<ActionResult<{ url: string }>> {
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return { ok: false, error: "invalid_data_url" }
  const mime = match[1]
  const base64 = match[2]
  if (!mime || !base64) return { ok: false, error: "invalid_data_url" }

  const buffer = Buffer.from(base64, "base64")
  if (buffer.byteLength > 5 * 1024 * 1024) {
    return { ok: false, error: "file_too_large" }
  }

  const admin = createAdminClient()
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg"
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await admin.storage
    .from("ads")
    .upload(path, buffer, { contentType: mime, upsert: false })
  if (error) return { ok: false, error: error.message }

  const { data: pub } = admin.storage.from("ads").getPublicUrl(path)
  return { ok: true, data: { url: pub.publicUrl } }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createAd(input: unknown): Promise<ActionResult> {
  const parsed = adSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("advertisements").insert(parsed.data as never)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/ads")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export async function updateAd(input: unknown): Promise<ActionResult> {
  const parsed = adUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const { id, ...rest } = parsed.data
  const admin = createAdminClient()
  const { error } = await admin
    .from("advertisements")
    .update(rest as never)
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/ads")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Toggle active
// ---------------------------------------------------------------------------
const toggleSchema = z.object({ id: z.uuid(), is_active: z.boolean() })

export async function toggleAdActive(input: unknown): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("advertisements")
    .update({ is_active: parsed.data.is_active } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/ads")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export async function deleteAd(id: unknown): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("advertisements").delete().eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/ads")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Update placement dimensions/description
// ---------------------------------------------------------------------------
export async function updatePlacement(input: unknown): Promise<ActionResult> {
  const parsed = placementUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const { id, ...rest } = parsed.data
  const admin = createAdminClient()
  const { error } = await admin
    .from("ad_placements")
    .update(rest as never)
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/ads/placements")
  // Bust ISR cache for every page under the [locale] layout (e.g. /ar, /fr, /ar/annonces …)
  revalidatePath("/[locale]", "layout")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Show / hide a placement on the public site
// ---------------------------------------------------------------------------
export async function setPlacementVisibility(
  input: unknown,
): Promise<ActionResult> {
  const parsed = placementVisibilitySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("ad_placements")
    .update({ is_active: parsed.data.is_active } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/ads/placements")
  // Bust ISR cache for every page under the [locale] layout (e.g. /ar, /fr, /ar/annonces …)
  revalidatePath("/[locale]", "layout")
  return { ok: true }
}

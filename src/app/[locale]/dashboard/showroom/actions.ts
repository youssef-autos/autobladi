"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  showroomInfoSchema,
  type ShowroomInfoInput,
} from "@/lib/validations/showroom"

export type UpdateResult = { ok: true; slug: string } | { ok: false; error: string }

/**
 * Create a showroom from the multi-step setup wizard. Promotes the user to
 * `pro` and inserts their showroom with the details they filled in.
 *
 * The row is created INACTIVE (is_active = false): it stays out of the public
 * directory until an admin approves it from the showrooms manager. This is
 * the "submit for approval" step of the creation flow.
 */
export async function submitShowroom(input: unknown): Promise<UpdateResult> {
  const parsed = showroomInfoSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? "validation" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  const admin = createAdminClient()

  // One showroom per user — bail if they already have one.
  const { data: existing } = await admin
    .from("showrooms")
    .select("slug")
    .eq("user_id", user.id)
    .maybeSingle<{ slug: string }>()
  if (existing) return { ok: false, error: "already_exists" }

  // Promote free accounts to pro (leave admin accounts untouched).
  await admin
    .from("profiles")
    .update({ account_type: "pro" } as never)
    .eq("id", user.id)
    .eq("account_type", "gratuit")

  const payload: ShowroomInfoInput = parsed.data
  const { error } = await admin
    .from("showrooms")
    .insert({ ...payload, user_id: user.id, is_active: false } as never)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }

  revalidatePath("/showrooms")
  revalidatePath("/dashboard/showroom")
  return { ok: true, slug: payload.slug }
}

export async function updateMyShowroom(
  input: unknown,
): Promise<UpdateResult> {
  const parsed = showroomInfoSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? "validation" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  // Ensure ownership before update (defense-in-depth alongside RLS)
  const { data: existing } = await supabase
    .from("showrooms")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; slug: string }>()
  if (!existing) return { ok: false, error: "no_showroom" }

  const payload: ShowroomInfoInput = parsed.data
  const { error } = await supabase
    .from("showrooms")
    .update(payload as never)
    .eq("user_id", user.id)
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "slug_taken" }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath(`/showroom/${payload.slug}`)
  revalidatePath(`/showroom/${existing.slug}`)
  revalidatePath("/showrooms")
  revalidatePath("/dashboard/showroom")
  return { ok: true, slug: payload.slug }
}

export type AddressResult = { label: string; lat: number; lng: number }

/**
 * Address search backing the map picker. Proxied through the server (rather
 * than called from the browser) so we can send a proper identifying
 * User-Agent, as OpenStreetMap's Nominatim usage policy asks for.
 */
export async function searchAddress(query: string): Promise<AddressResult[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const q = query.trim()
  if (q.length < 3) return []

  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", q)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "5")
  // This marketplace only serves Morocco — scoping results avoids noise
  // from identically-named streets/cities elsewhere.
  url.searchParams.set("countrycodes", "ma")

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "autobladi.ma (showroom location picker)" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as Array<{
      display_name: string
      lat: string
      lon: string
    }>
    return data
      .map((d) => ({ label: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }))
      .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
  } catch {
    return []
  }
}

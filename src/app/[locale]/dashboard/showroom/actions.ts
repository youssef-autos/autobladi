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

// Google's Maps app share links (maps.app.goo.gl) carry no coordinates
// themselves — only a redirect to the real, coordinate-bearing URL. The
// redirect can't be followed client-side (CORS), so we do it here. The
// hostname allowlist is what keeps this from being an open SSRF proxy.
const ALLOWED_MAPS_SHORT_LINK_HOSTS = new Set(["maps.app.goo.gl"])

export async function resolveMapsShortLink(
  url: string,
): Promise<{ ok: true; url: string } | { ok: false }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { ok: false }
  }
  if (parsed.protocol !== "https:" || !ALLOWED_MAPS_SHORT_LINK_HOSTS.has(parsed.hostname)) {
    return { ok: false }
  }

  try {
    const res = await fetch(parsed.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    })
    return { ok: true, url: res.url }
  } catch {
    return { ok: false }
  }
}

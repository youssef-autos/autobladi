"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  professionnelInfoSchema,
  type ProfessionnelInfoInput,
} from "@/lib/validations/professionnel"

export type UpdateResult = { ok: true; slug: string } | { ok: false; error: string }

/**
 * Create a professional showroom from the multi-step setup wizard. Promotes the
 * user to `pro` and inserts their showroom with the details they filled in.
 *
 * The row is created INACTIVE (is_active = false): it stays out of the public
 * directory until an admin approves it from the professionnels manager. This is
 * the "submit for approval" step of the creation flow.
 */
export async function submitProfessionnel(input: unknown): Promise<UpdateResult> {
  const parsed = professionnelInfoSchema.safeParse(input)
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
    .from("professionnels")
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

  const payload: ProfessionnelInfoInput = parsed.data
  const { error } = await admin
    .from("professionnels")
    .insert({ ...payload, user_id: user.id, is_active: false } as never)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }

  revalidatePath("/professionnels")
  revalidatePath("/dashboard/showroom")
  return { ok: true, slug: payload.slug }
}

export async function updateMyProfessionnel(
  input: unknown,
): Promise<UpdateResult> {
  const parsed = professionnelInfoSchema.safeParse(input)
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
    .from("professionnels")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; slug: string }>()
  if (!existing) return { ok: false, error: "no_professionnel" }

  const payload: ProfessionnelInfoInput = parsed.data
  const { error } = await supabase
    .from("professionnels")
    .update(payload as never)
    .eq("user_id", user.id)
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "slug_taken" }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath(`/professionnel/${payload.slug}`)
  revalidatePath(`/professionnel/${existing.slug}`)
  revalidatePath("/professionnels")
  revalidatePath("/dashboard/showroom")
  return { ok: true, slug: payload.slug }
}

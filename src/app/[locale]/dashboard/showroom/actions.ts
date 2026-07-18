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
 * Free one-click activation of a professional (dealer) account — replaces the
 * former paid subscription upgrade. Promotes the user to `pro` and creates
 * their professionnel/showroom placeholder if missing. Idempotent.
 */
export async function becomeProfessional(): Promise<UpdateResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  const admin = createAdminClient()

  // Promote free accounts to pro (leave admin accounts untouched).
  await admin
    .from("profiles")
    .update({ account_type: "pro" } as never)
    .eq("id", user.id)
    .eq("account_type", "gratuit")

  // Reuse an existing showroom row if there is one.
  const { data: existing } = await admin
    .from("professionnels")
    .select("slug")
    .eq("user_id", user.id)
    .maybeSingle<{ slug: string }>()
  if (existing) {
    revalidatePath("/dashboard/showroom")
    return { ok: true, slug: existing.slug }
  }

  // Created inactive: the showroom stays private until an admin approves it
  // (admin flips is_active from the professionnels manager).
  const shortId = user.id.replace(/-/g, "").slice(0, 8)
  const { data: created, error } = await admin
    .from("professionnels")
    .insert({
      user_id: user.id,
      name: `Concession ${shortId}`,
      slug: `concession-${shortId}`,
      is_active: false,
    } as never)
    .select("slug")
    .single<{ slug: string }>()
  if (error || !created) return { ok: false, error: "create_failed" }

  revalidatePath("/professionnels")
  revalidatePath("/dashboard/showroom")
  return { ok: true, slug: created.slug }
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

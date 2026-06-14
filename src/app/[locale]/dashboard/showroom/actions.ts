"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  professionnelInfoSchema,
  type ProfessionnelInfoInput,
} from "@/lib/validations/professionnel"

export type UpdateResult = { ok: true; slug: string } | { ok: false; error: string }

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

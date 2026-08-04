"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { reviewSchema } from "@/lib/validations/showroom"

export type ReviewActionResult = { ok: true } | { ok: false; error: string }

export async function addReview(input: unknown): Promise<ReviewActionResult> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  // Verify the user isn't reviewing their own showroom
  const { data: dealer } = await supabase
    .from("showrooms")
    .select("user_id, slug")
    .eq("id", parsed.data.showroomId)
    .maybeSingle<{ user_id: string; slug: string }>()
  if (!dealer) return { ok: false, error: "not_found" }
  if (dealer.user_id === user.id) return { ok: false, error: "self_review" }

  const insertPayload = {
    showroom_id: parsed.data.showroomId,
    user_id: user.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  }
  const { error } = await supabase
    .from("showroom_reviews")
    .insert(insertPayload as never)
  if (error) {
    // Unique constraint = already reviewed
    if (error.code === "23505") {
      return { ok: false, error: "already_reviewed" }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath(`/showroom/${dealer.slug}`)
  return { ok: true }
}

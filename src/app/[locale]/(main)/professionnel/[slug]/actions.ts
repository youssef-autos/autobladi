"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { reviewSchema } from "@/lib/validations/professionnel"

export type ReviewActionResult = { ok: true } | { ok: false; error: string }

export async function addReview(input: unknown): Promise<ReviewActionResult> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  // Verify the user isn't reviewing their own professionnel
  const { data: dealer } = await supabase
    .from("professionnels")
    .select("user_id, slug")
    .eq("id", parsed.data.professionnelId)
    .maybeSingle<{ user_id: string; slug: string }>()
  if (!dealer) return { ok: false, error: "not_found" }
  if (dealer.user_id === user.id) return { ok: false, error: "self_review" }

  const insertPayload = {
    professionnel_id: parsed.data.professionnelId,
    user_id: user.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  }
  const { error } = await supabase
    .from("professionnel_reviews")
    .insert(insertPayload as never)
  if (error) {
    // Unique constraint = already reviewed
    if (error.code === "23505") {
      return { ok: false, error: "already_reviewed" }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath(`/professionnel/${dealer.slug}`)
  return { ok: true }
}

export async function followProfessionnel(_id: unknown) {
  void _id
  // Stub — follow/unfollow requires a new "professionnel_follows" table.
  // Returning ok lets the UI show a toast without crashing.
  return { ok: true as const, stub: true }
}

void z

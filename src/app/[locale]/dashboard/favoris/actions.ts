"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export async function removeFavorite(favoriteId: unknown) {
  const parsed = z.uuid().safeParse(favoriteId)
  if (!parsed.success) return { ok: false, error: "invalid_id" } as const

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" } as const

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id)
  if (error) return { ok: false, error: error.message } as const
  revalidatePath("/dashboard/favoris")
  return { ok: true } as const
}

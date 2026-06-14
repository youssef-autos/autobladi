"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const updateSchema = z.object({
  full_name: z.string().min(2).max(80),
  phone: z.string().max(20).nullable(),
  whatsapp: z.string().max(20).nullable(),
  city: z.string().max(80).nullable(),
  avatar_url: z.string().url().nullable().optional(),
})

export async function updateMyProfile(input: unknown) {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" } as const

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" } as const

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data as never)
    .eq("id", user.id)
  if (error) return { ok: false, error: error.message } as const

  revalidatePath("/dashboard", "layout")
  return { ok: true } as const
}

export async function deleteMyAccount(confirmation: unknown) {
  if (confirmation !== "DELETE") {
    return { ok: false, error: "confirmation_required" } as const
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" } as const

  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) return { ok: false, error: error.message } as const
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "delete_failed",
    } as const
  }

  // Sign out the session locally (cookies cleared by the auth helper).
  await supabase.auth.signOut()
  return { ok: true } as const
}

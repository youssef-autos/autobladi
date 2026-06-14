"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export type CacheResult = { ok: true } | { ok: false; error: string }

/**
 * Admin-only "Cache Clear": revalidates every rendered route so the freshest
 * data + settings + translations show immediately.
 */
export async function clearCache(): Promise<CacheResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  if (profile?.account_type !== "admin") return { ok: false, error: "forbidden" }

  revalidatePath("/", "layout")
  return { ok: true }
}

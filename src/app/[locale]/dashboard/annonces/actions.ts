"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type ActionResult = { ok: true } | { ok: false; error: string }

const DEFAULT_DURATION_DAYS = 60

const idSchema = z.uuid()

async function authedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null }
  return { supabase, user }
}

export async function deleteMyAnnonce(input: unknown): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const { supabase, user } = await authedClient()
  if (!user) return { ok: false, error: "auth_required" }

  // RLS already restricts to owner — eq("user_id") is defence-in-depth.
  const { error } = await supabase
    .from("annonces")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/dashboard/annonces")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function markAsSold(input: unknown): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const { supabase, user } = await authedClient()
  if (!user) return { ok: false, error: "auth_required" }

  const { error } = await supabase
    .from("annonces")
    .update({ status: "sold" } as never)
    .eq("id", parsed.data)
    .eq("user_id", user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/dashboard/annonces")
  return { ok: true }
}

type DbClient = Awaited<ReturnType<typeof createClient>>

// Pro accounts get a longer lifetime (annonce_duration_days_pro);
// regular (gratuit) accounts use annonce_duration_days.
async function getDurationDays(
  supabase: DbClient,
  userId: string,
): Promise<number> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle<{ account_type: string }>()
  const key =
    profile?.account_type === "pro"
      ? "annonce_duration_days_pro"
      : "annonce_duration_days"

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle<{ value: unknown }>()
  const raw = data?.value
  if (typeof raw === "number" && raw > 0) return raw
  if (typeof raw === "string" && !Number.isNaN(Number(raw)) && Number(raw) > 0) {
    return Number(raw)
  }
  return DEFAULT_DURATION_DAYS
}

export async function renewAnnonce(input: unknown): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const { supabase, user } = await authedClient()
  if (!user) return { ok: false, error: "auth_required" }

  const days = await getDurationDays(supabase, user.id)
  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString()

  const { error } = await supabase
    .from("annonces")
    .update({ expires_at: expiresAt, status: "active" } as never)
    .eq("id", parsed.data)
    .eq("user_id", user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/dashboard/annonces")
  return { ok: true }
}

/**
 * Toggle the "featured" (mise en avant) flag on an owned annonce.
 * Featured listings are a Pro-only perk — free accounts are rejected with
 * `pro_only` so the UI can prompt an upgrade.
 */
export async function toggleFeatured(input: unknown): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const { supabase, user } = await authedClient()
  if (!user) return { ok: false, error: "auth_required" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  const isPro =
    profile?.account_type === "pro" || profile?.account_type === "admin"
  if (!isPro) return { ok: false, error: "pro_only" }

  const { data: current } = await supabase
    .from("annonces")
    .select("featured")
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .maybeSingle<{ featured: boolean }>()
  if (!current) return { ok: false, error: "not_found" }

  const { error: updError } = await supabase
    .from("annonces")
    .update({ featured: !current.featured } as never)
    .eq("id", parsed.data)
    .eq("user_id", user.id)
  if (updError) return { ok: false, error: updError.message }

  revalidatePath("/dashboard/annonces")
  revalidatePath("/annonces")
  return { ok: true }
}

"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type SettingsInput = {
  site_logo_url_ar: string
  site_logo_url_fr: string
  site_favicon_url: string
  watermark_text: string
  annonce_duration_days: number
  annonce_duration_days_pro: number
  free_max_annonces: number
  subscription_grace_days: number
  ai_provider: "gemini" | "openai" | "qwen"
  ai_gemini_key: string
  ai_openai_key: string
  ai_openai_model: string
  ai_qwen_key: string
  ai_qwen_model: string
  contact_email: string
  contact_phone: string
  bank_name: string
  rib: string
  bank_beneficiary: string
}

export type SettingsResult =
  | { ok: true }
  | { ok: false; error: string }

const inputSchema = z.object({
  site_logo_url_ar: z.string().max(1000),
  site_logo_url_fr: z.string().max(1000),
  site_favicon_url: z.string().max(1000),
  watermark_text: z.string().min(1).max(100),
  annonce_duration_days: z.number().int().min(1).max(365),
  annonce_duration_days_pro: z.number().int().min(1).max(365),
  free_max_annonces: z.number().int().min(0).max(1000),
  subscription_grace_days: z.number().int().min(0).max(90),
  ai_provider: z.enum(["gemini", "openai", "qwen"]),
  ai_gemini_key: z.string().max(500),
  ai_openai_key: z.string().max(500),
  ai_openai_model: z.string().max(100),
  ai_qwen_key: z.string().max(500),
  ai_qwen_model: z.string().max(100),
  contact_email: z.string().email().or(z.literal("")),
  contact_phone: z.string().max(40),
  bank_name: z.string().max(100),
  rib: z.string().max(200),
  bank_beneficiary: z.string().max(100),
})

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, ok: false as const, error: "auth_required" }
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  if (profile?.account_type !== "admin") {
    return { supabase, ok: false as const, error: "forbidden" }
  }
  return { supabase, ok: true as const }
}

export async function saveSettings(input: unknown): Promise<SettingsResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }
  const v = parsed.data

  const guard = await assertAdmin()
  if (!guard.ok) return { ok: false, error: guard.error }
  const supabase = guard.supabase

  type Upsert = { key: string; value: unknown }
  const rows: Upsert[] = [
    { key: "site_logo_url_ar", value: v.site_logo_url_ar },
    { key: "site_logo_url_fr", value: v.site_logo_url_fr },
    { key: "site_favicon_url", value: v.site_favicon_url },
    { key: "watermark_text", value: v.watermark_text },
    { key: "annonce_duration_days", value: v.annonce_duration_days },
    { key: "annonce_duration_days_pro", value: v.annonce_duration_days_pro },
    { key: "free_max_annonces", value: v.free_max_annonces },
    { key: "subscription_grace_days", value: v.subscription_grace_days },
    { key: "contact_email", value: v.contact_email },
    { key: "contact_phone", value: v.contact_phone },
    { key: "bank_name", value: v.bank_name },
    { key: "rib", value: v.rib },
    { key: "bank_beneficiary", value: v.bank_beneficiary },
  ]

  const { error } = await supabase
    .from("site_settings")
    .upsert(rows as never, { onConflict: "key" })

  if (error) {
    return { ok: false, error: error.message }
  }

  // AI keys are secrets → stored in the admin-only `ai_settings` table, never in
  // the public-read `site_settings`. A blank key field means "keep the existing
  // value" so the admin never has to re-paste a key just to change the provider.
  const aiUpdate: Record<string, unknown> = {
    id: true,
    provider: v.ai_provider,
    openai_model: v.ai_openai_model,
    qwen_model: v.ai_qwen_model,
    updated_at: new Date().toISOString(),
  }
  if (v.ai_gemini_key.trim()) aiUpdate.gemini_key = v.ai_gemini_key.trim()
  if (v.ai_openai_key.trim()) aiUpdate.openai_key = v.ai_openai_key.trim()
  if (v.ai_qwen_key.trim()) aiUpdate.qwen_key = v.ai_qwen_key.trim()

  const { error: aiError } = await supabase
    .from("ai_settings")
    .upsert(aiUpdate as never, { onConflict: "id" })

  if (aiError) {
    return { ok: false, error: aiError.message }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}

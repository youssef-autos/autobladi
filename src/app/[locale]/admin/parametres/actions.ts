"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type SettingsInput = {
  site_logo_url_light: string
  site_logo_url_dark: string
  site_favicon_url: string
  google_site_verification: string
  bing_site_verification: string
  yandex_verification: string
  pinterest_verification: string
  custom_head_code: string
  google_analytics_id: string
  annonce_duration_days: number
  annonce_duration_days_pro: number
  ai_provider: "gemini" | "openai" | "qwen"
  ai_gemini_key: string
  ai_openai_key: string
  ai_openai_model: string
  ai_qwen_key: string
  ai_qwen_model: string
  contact_email: string
  contact_phone: string
}

export type SettingsResult =
  | { ok: true }
  | { ok: false; error: string }

const inputSchema = z.object({
  site_logo_url_light: z.string().max(1000),
  site_logo_url_dark: z.string().max(1000),
  site_favicon_url: z.string().max(1000),
  google_site_verification: z.string().max(200),
  bing_site_verification: z.string().max(200),
  yandex_verification: z.string().max(200),
  pinterest_verification: z.string().max(200),
  custom_head_code: z.string().max(5000),
  google_analytics_id: z.string().max(30),
  annonce_duration_days: z.number().int().min(1).max(365),
  annonce_duration_days_pro: z.number().int().min(1).max(365),
  ai_provider: z.enum(["gemini", "openai", "qwen"]),
  ai_gemini_key: z.string().max(500),
  ai_openai_key: z.string().max(500),
  ai_openai_model: z.string().max(100),
  ai_qwen_key: z.string().max(500),
  ai_qwen_model: z.string().max(100),
  contact_email: z.string().email().or(z.literal("")),
  contact_phone: z.string().max(40),
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
    { key: "site_logo_url_light", value: v.site_logo_url_light },
    { key: "site_logo_url_dark", value: v.site_logo_url_dark },
    { key: "site_favicon_url", value: v.site_favicon_url },
    { key: "google_site_verification", value: v.google_site_verification },
    { key: "bing_site_verification", value: v.bing_site_verification },
    { key: "yandex_verification", value: v.yandex_verification },
    { key: "pinterest_verification", value: v.pinterest_verification },
    { key: "custom_head_code", value: v.custom_head_code },
    { key: "google_analytics_id", value: v.google_analytics_id },
    { key: "annonce_duration_days", value: v.annonce_duration_days },
    { key: "annonce_duration_days_pro", value: v.annonce_duration_days_pro },
    { key: "contact_email", value: v.contact_email },
    { key: "contact_phone", value: v.contact_phone },
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

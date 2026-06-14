"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type SocialResult = { ok: true } | { ok: false; error: string }

const providerSchema = z.object({
  enabled: z.boolean(),
  clientId: z.string().max(500),
  secret: z.string().max(500),
  redirectUrl: z.string().max(500),
})

const schema = z.object({
  facebook: providerSchema,
  google: providerSchema,
})

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  if (profile?.account_type !== "admin") return null
  return supabase
}

export async function saveSocialLogin(input: unknown): Promise<SocialResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }

  const supabase = await assertAdmin()
  if (!supabase) return { ok: false, error: "forbidden" }

  const now = new Date().toISOString()
  const rows = [
    {
      provider: "facebook",
      enabled: parsed.data.facebook.enabled,
      client_id: parsed.data.facebook.clientId.trim(),
      secret: parsed.data.facebook.secret.trim(),
      redirect_url: parsed.data.facebook.redirectUrl.trim(),
      updated_at: now,
    },
    {
      provider: "google",
      enabled: parsed.data.google.enabled,
      client_id: parsed.data.google.clientId.trim(),
      secret: parsed.data.google.secret.trim(),
      redirect_url: parsed.data.google.redirectUrl.trim(),
      updated_at: now,
    },
  ]

  const { error } = await supabase
    .from("social_login_settings")
    .upsert(rows as never, { onConflict: "provider" })
  if (error) return { ok: false, error: error.message }

  revalidatePath("/", "layout")
  return { ok: true }
}

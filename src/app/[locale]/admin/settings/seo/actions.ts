"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type SeoResult = { ok: true } | { ok: false; error: string }

const schema = z.object({
  google_site_verification: z.string().max(200),
  bing_site_verification: z.string().max(200),
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

export async function saveSeoSettings(input: unknown): Promise<SeoResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }

  const supabase = await assertAdmin()
  if (!supabase) return { ok: false, error: "forbidden" }

  // Public values (they appear in the page <head>) → site_settings is fine.
  const rows = [
    {
      key: "google_site_verification",
      value: parsed.data.google_site_verification.trim(),
    },
    {
      key: "bing_site_verification",
      value: parsed.data.bing_site_verification.trim(),
    },
  ]
  const { error } = await supabase
    .from("site_settings")
    .upsert(rows as never, { onConflict: "key" })
  if (error) return { ok: false, error: error.message }

  // The codes are rendered by the root layout — revalidate the whole site.
  revalidatePath("/", "layout")
  revalidatePath("/admin/settings/seo")
  return { ok: true }
}

"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type AuthSettingsResult = { ok: true } | { ok: false; error: string }

const schema = z.object({
  require_email_confirmation: z.boolean(),
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

export async function saveAuthSettings(input: unknown): Promise<AuthSettingsResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }

  const supabase = await assertAdmin()
  if (!supabase) return { ok: false, error: "forbidden" }

  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { key: "require_email_confirmation", value: parsed.data.require_email_confirmation } as never,
      { onConflict: "key" },
    )
  if (error) return { ok: false, error: error.message }

  revalidatePath("/", "layout")
  return { ok: true }
}

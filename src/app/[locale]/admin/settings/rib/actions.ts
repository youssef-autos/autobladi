"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type RibResult = { ok: true } | { ok: false; error: string }

const schema = z.object({
  bank_name: z.string().trim().max(100),
  rib: z.string().trim().max(120),
  bank_beneficiary: z.string().trim().max(100),
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

export async function saveBankSettings(input: unknown): Promise<RibResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }
  const v = parsed.data

  const guard = await assertAdmin()
  if (!guard.ok) return { ok: false, error: guard.error }

  // Keys read by getBankSettings() + shown on the subscription payment page.
  const rows = [
    { key: "bank_name", value: v.bank_name },
    { key: "rib", value: v.rib },
    { key: "bank_beneficiary", value: v.bank_beneficiary },
  ]
  const { error } = await guard.supabase
    .from("site_settings")
    .upsert(rows as never, { onConflict: "key" })
  if (error) return { ok: false, error: error.message }

  revalidatePath("/", "layout")
  revalidatePath("/admin/settings/rib")
  return { ok: true }
}

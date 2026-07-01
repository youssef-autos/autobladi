"use server"

import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type ChangeEmailResult = { ok: true } | { ok: false; error: string }

const schema = z.object({
  email: z.string().email(),
})

export async function changeAdminEmail(input: unknown): Promise<ChangeEmailResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_email" }

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

  const newEmail = parsed.data.email.trim().toLowerCase()
  if (newEmail === user.email) return { ok: false, error: "same_email" }

  // Use service-role client to update email without triggering confirmation emails.
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(user.id, {
    email: newEmail,
  })
  if (error) return { ok: false, error: error.message }

  return { ok: true }
}

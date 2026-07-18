"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { invalidateEmailSettingsCache, type EmailType } from "@/lib/email/settings"
import { invalidateResendCache } from "@/lib/email/client"
import { sendTestEmail } from "@/lib/email/send"

export type SettingsResult =
  | { ok: true }
  | { ok: false; error: string }

const EMAIL_TYPES: EmailType[] = [
  "welcome",
  "annonce_pending",
  "annonce_approved",
  "annonce_rejected",
  "verification_approved",
  "verification_rejected",
  "annonce_expiring",
  "contact_notification",
  "report_notification",
  "newsletter",
]

const settingsSchema = z.object({
  from: z.string().min(3).max(200),
  replyTo: z.email().or(z.literal("")),
  enabled: z.record(z.string(), z.boolean()),
  // Secret — stored in the admin-only app_secrets table, never site_settings.
  // Blank means "keep the saved key".
  resend_key: z.string().max(500).optional().default(""),
})

async function ensureAdmin() {
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
  return user
}

export async function saveEmailSettings(
  input: unknown,
): Promise<SettingsResult> {
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  // Normalize enabled to only the known email types so the admin can't
  // sneak extra keys into the JSON blob.
  const normalized: Record<EmailType, boolean> = Object.fromEntries(
    EMAIL_TYPES.map((t) => [t, parsed.data.enabled[t] !== false]),
  ) as Record<EmailType, boolean>

  const admin = createAdminClient()
  const rows = [
    { key: "email_from", value: parsed.data.from },
    { key: "email_reply_to", value: parsed.data.replyTo },
    { key: "email_enabled", value: normalized },
  ]
  for (const row of rows) {
    const { error } = await admin
      .from("site_settings")
      .upsert(row as never, { onConflict: "key" })
    if (error) return { ok: false, error: error.message }
  }

  // Resend key (secret) → admin-only app_secrets. Blank = keep existing.
  const resendKey = (parsed.data.resend_key ?? "").trim()
  if (resendKey) {
    const { error } = await admin.from("app_secrets").upsert(
      { id: true, resend_key: resendKey, updated_at: new Date().toISOString() } as never,
      { onConflict: "id" },
    )
    if (error) return { ok: false, error: error.message }
    invalidateResendCache()
  }

  invalidateEmailSettingsCache()
  revalidatePath("/admin/settings/email")
  return { ok: true }
}

const testSchema = z.object({ to: z.email() })

export async function sendTestEmailAction(
  input: unknown,
): Promise<SettingsResult> {
  const parsed = testSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_email" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }
  const res = await sendTestEmail(parsed.data.to)
  if (!res.ok) return { ok: false, error: res.error }
  return { ok: true }
}

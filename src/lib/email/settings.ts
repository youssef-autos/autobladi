import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type EmailType =
  | "welcome"
  | "annonce_pending"
  | "annonce_approved"
  | "annonce_rejected"
  | "contact_notification"
  | "report_notification"
  | "newsletter"

export type EmailSettings = {
  from: string
  replyTo: string
  enabled: Record<EmailType, boolean>
  adminEmail: string
}

const DEFAULTS: EmailSettings = {
  from: "autobladi <noreply@autobladi.ma>",
  replyTo: "contact@autobladi.ma",
  enabled: {
    welcome: true,
    annonce_pending: true,
    annonce_approved: true,
    annonce_rejected: true,
    contact_notification: true,
    report_notification: true,
    newsletter: true,
  },
  adminEmail: "contact@autobladi.ma",
}

// Small TTL cache so we don't hit Supabase on every email send. site_settings
// is admin-edited from /admin/settings/email; we invalidate via revalidatePath
// in that action, but this also avoids per-request DB hits inside the same
// Node process.
let CACHE: { value: EmailSettings; expiresAt: number } | null = null
const TTL_MS = 60_000

export function invalidateEmailSettingsCache(): void {
  CACHE = null
}

export async function getEmailSettings(): Promise<EmailSettings> {
  if (CACHE && CACHE.expiresAt > Date.now()) {
    return CACHE.value
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from("site_settings")
    .select("key, value")
    .in("key", ["email_from", "email_reply_to", "email_enabled", "contact_email"])

  type Row = { key: string; value: unknown }
  const rows = (data ?? []) as unknown as Row[]
  const map = new Map(rows.map((r) => [r.key, r.value]))

  const fromVal = map.get("email_from")
  const replyVal = map.get("email_reply_to")
  const enabledVal = map.get("email_enabled")
  const adminVal = map.get("contact_email")

  const value: EmailSettings = {
    from: typeof fromVal === "string" ? fromVal : DEFAULTS.from,
    replyTo:
      typeof replyVal === "string" ? replyVal : DEFAULTS.replyTo,
    enabled:
      enabledVal && typeof enabledVal === "object"
        ? { ...DEFAULTS.enabled, ...(enabledVal as Record<EmailType, boolean>) }
        : DEFAULTS.enabled,
    adminEmail:
      typeof adminVal === "string" && adminVal
        ? adminVal
        : DEFAULTS.adminEmail,
  }

  CACHE = { value, expiresAt: Date.now() + TTL_MS }
  return value
}

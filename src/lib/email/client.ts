import "server-only"

import { Resend } from "resend"

import { createAdminClient } from "@/lib/supabase/admin"

// The Resend key is a secret managed from /admin/settings/email and stored in
// the admin-only `app_secrets` table (never in public-read site_settings).
// Falls back to the RESEND_API_KEY env var, so email works either way.
let _client: { key: string; instance: Resend } | null = null
let _keyCache: { key: string; expiresAt: number } | null = null
const TTL_MS = 60_000

async function resolveKey(): Promise<string> {
  if (_keyCache && _keyCache.expiresAt > Date.now()) return _keyCache.key
  let key = ""
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("app_secrets")
      .select("resend_key")
      .eq("id", true)
      .maybeSingle<{ resend_key: string }>()
    key = (data?.resend_key ?? "").trim()
  } catch {
    // table missing / no service key → fall back to env
  }
  if (!key) key = (process.env.RESEND_API_KEY ?? "").trim()
  _keyCache = { key, expiresAt: Date.now() + TTL_MS }
  return key
}

/**
 * Lazy Resend client. Returns null when no key is configured (the caller then
 * skips the send — logged, never throws), useful in local dev.
 */
export async function getResend(): Promise<Resend | null> {
  const key = await resolveKey()
  if (!key) return null
  if (_client && _client.key === key) return _client.instance
  _client = { key, instance: new Resend(key) }
  return _client.instance
}

export async function isResendConfigured(): Promise<boolean> {
  return Boolean(await resolveKey())
}

/** Clear the cached key/client after the admin updates the key. */
export function invalidateResendCache(): void {
  _keyCache = null
  _client = null
}

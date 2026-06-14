import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type ProviderConfig = {
  enabled: boolean
  clientId: string
  secret: string
  redirectUrl: string
}

export type SocialLoginConfig = {
  facebook: ProviderConfig
  google: ProviderConfig
}

type Row = {
  provider: string
  enabled: boolean
  client_id: string
  secret: string
  redirect_url: string
}

function empty(): ProviderConfig {
  return { enabled: false, clientId: "", secret: "", redirectUrl: "" }
}

function fromRow(row: Row | undefined): ProviderConfig {
  if (!row) return empty()
  return {
    enabled: row.enabled,
    clientId: row.client_id,
    secret: row.secret,
    redirectUrl: row.redirect_url,
  }
}

/** Full config (incl. secrets) — admin only, RLS-guarded. */
export async function getSocialLoginConfig(): Promise<SocialLoginConfig> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("social_login_settings")
    .select("provider, enabled, client_id, secret, redirect_url")
  const rows = (data ?? []) as Row[]
  return {
    facebook: fromRow(rows.find((r) => r.provider === "facebook")),
    google: fromRow(rows.find((r) => r.provider === "google")),
  }
}

/**
 * Only the on/off flags — safe to compute on public pages (no secrets leave the
 * server). Uses the service-role client because the table is admin-only RLS.
 */
export async function getSocialLoginEnabled(): Promise<{
  facebook: boolean
  google: boolean
}> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("social_login_settings")
      .select("provider, enabled")
    const rows = (data ?? []) as Array<{ provider: string; enabled: boolean }>
    return {
      facebook: rows.find((r) => r.provider === "facebook")?.enabled ?? false,
      google: rows.find((r) => r.provider === "google")?.enabled ?? false,
    }
  } catch {
    return { facebook: false, google: false }
  }
}

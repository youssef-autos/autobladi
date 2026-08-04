import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export type AdminUserRow = Pick<
  Tables<"profiles">,
  | "id"
  | "full_name"
  | "phone"
  | "whatsapp"
  | "avatar_url"
  | "account_type"
  | "city"
  | "created_at"
> & { email: string | null }

export async function listUsers(opts: {
  q?: string
  accountType?: Tables<"profiles">["account_type"] | null
  limit?: number
}): Promise<AdminUserRow[]> {
  const supabase = await createClient()
  const needle = opts.q?.trim().toLowerCase() ?? ""
  const hasQuery = needle.length > 0
  const limit = opts.limit ?? 100

  let q = supabase
    .from("profiles")
    .select(
      "id, full_name, phone, whatsapp, avatar_url, account_type, city, created_at",
    )
    // Admin accounts are managed from each admin's own account page, not here.
    .neq("account_type", "admin")
    .order("created_at", { ascending: false })
    // When searching, pull a wider window so the in-memory filter — which also
    // matches the email (fetched separately from auth) — sees all candidates.
    .limit(hasQuery ? 1000 : limit)
  if (opts.accountType) q = q.eq("account_type", opts.accountType)
  const { data } = await q
  const rows = (data ?? []) as unknown as Omit<AdminUserRow, "email">[]

  // Emails live in auth.users — fetch them via the service-role admin client
  // and merge by id.
  const emailById = new Map<string, string | null>()
  try {
    const admin = createAdminClient()
    const { data: authData } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    for (const u of authData?.users ?? []) {
      emailById.set(u.id, u.email ?? null)
    }
  } catch (e) {
    console.error("[listUsers] email fetch", (e as Error).message)
  }

  let merged: AdminUserRow[] = rows.map((r) => ({
    ...r,
    email: emailById.get(r.id) ?? null,
  }))

  // Search across name, phone, whatsapp, city and email (contains match).
  if (hasQuery) {
    merged = merged
      .filter((r) =>
        [r.full_name, r.phone, r.whatsapp, r.city, r.email].some((v) =>
          (v ?? "").toLowerCase().includes(needle),
        ),
      )
      .slice(0, limit)
  }

  return merged
}

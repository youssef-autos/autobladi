import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"

export type Plan = Tables<"subscription_plans">

export async function listActivePlans(): Promise<Plan[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true })
  return (data ?? []) as unknown as Plan[]
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle<Plan>()
  if (error) console.error("[getPlanById]", id, error.message, error.code)
  if (!data) console.warn("[getPlanById] no plan found for id:", id)
  return data ?? null
}

export type SubscriptionRequestRow = Pick<
  Tables<"subscription_requests">,
  | "id"
  | "plan_id"
  | "amount"
  | "status"
  | "bank_reference"
  | "starts_at"
  | "ends_at"
  | "rejection_reason"
  | "created_at"
  | "reviewed_at"
> & {
  plan: Pick<Plan, "id" | "name" | "name_ar" | "duration_days" | "max_annonces"> | null
}

type RawRow = Tables<"subscription_requests"> & {
  subscription_plans: Pick<
    Plan,
    "id" | "name" | "name_ar" | "duration_days" | "max_annonces"
  > | null
}

function mapRow(row: RawRow): SubscriptionRequestRow {
  return {
    id: row.id,
    plan_id: row.plan_id,
    amount: row.amount,
    status: row.status,
    bank_reference: row.bank_reference,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    rejection_reason: row.rejection_reason,
    created_at: row.created_at,
    reviewed_at: row.reviewed_at,
    plan: row.subscription_plans,
  }
}

export async function getMyLatestRequest(): Promise<SubscriptionRequestRow | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("subscription_requests")
    .select(`
      id, plan_id, amount, status, bank_reference, starts_at, ends_at,
      rejection_reason, created_at, reviewed_at,
      subscription_plans(id, name, name_ar, duration_days, max_annonces)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return mapRow(data as unknown as RawRow)
}

export async function getMyPendingRequest(): Promise<SubscriptionRequestRow | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("subscription_requests")
    .select(`
      id, plan_id, amount, status, bank_reference, starts_at, ends_at,
      rejection_reason, created_at, reviewed_at,
      subscription_plans(id, name, name_ar, duration_days, max_annonces)
    `)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return mapRow(data as unknown as RawRow)
}

export async function getMyActiveSubscription(): Promise<SubscriptionRequestRow | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const nowIso = new Date().toISOString()
  const { data } = await supabase
    .from("subscription_requests")
    .select(`
      id, plan_id, amount, status, bank_reference, starts_at, ends_at,
      rejection_reason, created_at, reviewed_at,
      subscription_plans(id, name, name_ar, duration_days, max_annonces)
    `)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("ends_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return mapRow(data as unknown as RawRow)
}

export async function listMyRequests(
  limit = 20,
): Promise<SubscriptionRequestRow[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from("subscription_requests")
    .select(`
      id, plan_id, amount, status, bank_reference, starts_at, ends_at,
      rejection_reason, created_at, reviewed_at,
      subscription_plans(id, name, name_ar, duration_days, max_annonces)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)
  const rows = (data ?? []) as unknown as RawRow[]
  return rows.map(mapRow)
}

export type BankSettings = {
  bank_name: string
  rib: string
  beneficiary: string
}

function extractString(raw: unknown): string {
  if (typeof raw === "string") return raw
  if (raw && typeof raw === "object" && "text" in raw) {
    const t = (raw as { text: unknown }).text
    if (typeof t === "string") return t
  }
  return ""
}

export async function getBankSettings(): Promise<BankSettings> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["rib", "bank_name", "bank_beneficiary"])
  const rows = (data ?? []) as unknown as Array<{ key: string; value: unknown }>
  const byKey = new Map(rows.map((r) => [r.key, r.value]))
  return {
    bank_name: extractString(byKey.get("bank_name")),
    rib: extractString(byKey.get("rib")),
    beneficiary: extractString(byKey.get("bank_beneficiary")) || "autobladi.ma",
  }
}

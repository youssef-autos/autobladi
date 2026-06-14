"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type UpgradeResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string }

const requestSchema = z.object({
  planId: z.uuid(),
  receiptPath: z.string().min(3),
  // Optional — the bank transfer reference may not always be known.
  bankReference: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
})

export async function requestUpgrade(input: unknown): Promise<UpgradeResult> {
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? "validation" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  // Confirm the plan exists & is active
  type PlanRow = { id: string; price: number; is_active: boolean }
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id, price, is_active")
    .eq("id", parsed.data.planId)
    .maybeSingle<PlanRow>()
  if (!plan || !plan.is_active) {
    return { ok: false, error: "plan_not_found" }
  }

  // Reject if a pending request already exists for this user
  const { data: existing } = await supabase
    .from("subscription_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle<{ id: string }>()
  if (existing) return { ok: false, error: "already_pending" }

  const insertPayload = {
    user_id: user.id,
    plan_id: plan.id,
    amount: plan.price,
    receipt_url: parsed.data.receiptPath, // private path, not public URL
    bank_reference: parsed.data.bankReference || null,
    rejection_reason: parsed.data.notes ?? null,
    status: "pending" as const,
  }
  const { data: inserted, error } = await supabase
    .from("subscription_requests")
    .insert(insertPayload as never)
    .select("id")
    .single<{ id: string }>()
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/upgrade")
  revalidatePath("/subscription")
  return { ok: true, requestId: inserted.id }
}

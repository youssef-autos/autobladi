"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { planSchema, planUpdateSchema } from "@/lib/validations/plan"

export type PlanResult = { ok: true } | { ok: false; error: string }

async function adminClient() {
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
  return { supabase, adminId: user.id }
}

function revalidate() {
  revalidatePath("/admin/subscriptions/plans")
  revalidatePath("/admin")
  // User-facing pages that list the active plans.
  revalidatePath("/dashboard/upgrade")
  revalidatePath("/subscription")
}

export async function createPlan(input: unknown): Promise<PlanResult> {
  const parsed = planSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error } = await ctx.supabase
    .from("subscription_plans")
    .insert(parsed.data as never)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

export async function updatePlan(input: unknown): Promise<PlanResult> {
  const parsed = planUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { id, ...rest } = parsed.data
  const { error } = await ctx.supabase
    .from("subscription_plans")
    .update(rest as never)
    .eq("id", id)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

const toggleSchema = z.object({ id: z.uuid(), is_active: z.boolean() })

export async function togglePlanActive(input: unknown): Promise<PlanResult> {
  const parsed = toggleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error } = await ctx.supabase
    .from("subscription_plans")
    .update({ is_active: parsed.data.is_active } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

export async function deletePlan(input: unknown): Promise<PlanResult> {
  const parsed = z.uuid().safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error } = await ctx.supabase
    .from("subscription_plans")
    .delete()
    .eq("id", parsed.data)
  if (error) {
    // subscription_requests.plan_id references plans ON DELETE RESTRICT.
    if (error.code === "23503") return { ok: false, error: "plan_in_use" }
    return { ok: false, error: error.message }
  }

  revalidate()
  return { ok: true }
}

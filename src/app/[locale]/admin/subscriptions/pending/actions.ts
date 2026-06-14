"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getRecipientById } from "@/lib/email/recipients"
import {
  sendSubscriptionApprovedEmail,
  sendSubscriptionRejectedEmail,
} from "@/lib/email/send"

export type ModResult = { ok: true } | { ok: false; error: string }

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
  return { supabase, adminId: user.id }
}

const idSchema = z.uuid()
const rejectSchema = z.object({ id: z.uuid(), reason: z.string().min(3).max(500) })

export async function approveSubscription(input: unknown): Promise<ModResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }

  // The BEFORE-UPDATE trigger from migration 006 handles:
  //  - profiles.account_type → 'pro'
  //  - professionnel placeholder
  //  - starts_at / ends_at from plan duration
  const { error } = await ctx.supabase
    .from("subscription_requests")
    .update({
      status: "approved",
      reviewed_by: ctx.adminId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    } as never)
    .eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }

  // Re-read so we have the trigger-populated ends_at + plan name.
  const { data: row } = await ctx.supabase
    .from("subscription_requests")
    .select(
      `user_id, ends_at,
       subscription_plans(name, name_ar)`,
    )
    .eq("id", parsed.data)
    .maybeSingle()
  type ApprovedRow = {
    user_id: string
    ends_at: string | null
    subscription_plans: { name: string; name_ar: string | null } | null
  }
  const approved = row as unknown as ApprovedRow | null
  if (approved) {
    const recipient = await getRecipientById(approved.user_id)
    if (recipient) {
      const planName =
        (recipient.lang === "ar"
          ? approved.subscription_plans?.name_ar
          : approved.subscription_plans?.name) ??
        approved.subscription_plans?.name ??
        "Pro"
      const endsAt = approved.ends_at
        ? new Date(approved.ends_at).toLocaleDateString(recipient.lang)
        : "—"
      void sendSubscriptionApprovedEmail({
        to: recipient.email,
        name: recipient.name,
        planName,
        endsAt,
        lang: recipient.lang,
      })
    }
  }

  revalidatePath("/admin/subscriptions/pending")
  revalidatePath("/admin")
  return { ok: true }
}

export async function rejectSubscription(input: unknown): Promise<ModResult> {
  const parsed = rejectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { data: row } = await ctx.supabase
    .from("subscription_requests")
    .select(
      `user_id,
       subscription_plans(name, name_ar)`,
    )
    .eq("id", parsed.data.id)
    .maybeSingle()
  type RejectedRow = {
    user_id: string
    subscription_plans: { name: string; name_ar: string | null } | null
  }
  const req = row as unknown as RejectedRow | null

  const { error } = await ctx.supabase
    .from("subscription_requests")
    .update({
      status: "rejected",
      reviewed_by: ctx.adminId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: parsed.data.reason,
    } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }

  if (req) {
    const recipient = await getRecipientById(req.user_id)
    if (recipient) {
      const planName =
        (recipient.lang === "ar"
          ? req.subscription_plans?.name_ar
          : req.subscription_plans?.name) ??
        req.subscription_plans?.name ??
        "Pro"
      void sendSubscriptionRejectedEmail({
        to: recipient.email,
        name: recipient.name,
        planName,
        reason: parsed.data.reason,
        lang: recipient.lang,
      })
    }
  }

  revalidatePath("/admin/subscriptions/pending")
  revalidatePath("/admin")
  return { ok: true }
}

export async function getSignedReceiptUrl(
  path: unknown,
  ttlSeconds: number = 60,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (typeof path !== "string" || !path) {
    return { ok: false, error: "invalid_path" }
  }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from("receipts")
    .createSignedUrl(path, ttlSeconds)
  if (error || !data) return { ok: false, error: error?.message ?? "sign_failed" }
  return { ok: true, url: data.signedUrl }
}

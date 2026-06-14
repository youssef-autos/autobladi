"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getRecipientById } from "@/lib/email/recipients"
import {
  sendVerificationApprovedEmail,
  sendVerificationRejectedEmail,
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

export async function approveVerification(input: unknown): Promise<ModResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { data: req } = await ctx.supabase
    .from("verification_requests")
    .select("user_id")
    .eq("id", parsed.data)
    .maybeSingle<{ user_id: string }>()

  // is_verified flip is handled by trigger 005
  const { error } = await ctx.supabase
    .from("verification_requests")
    .update({
      status: "approved",
      reviewed_by: ctx.adminId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    } as never)
    .eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }

  if (req) {
    const recipient = await getRecipientById(req.user_id)
    if (recipient) {
      void sendVerificationApprovedEmail({
        to: recipient.email,
        name: recipient.name,
        lang: recipient.lang,
      })
    }
  }

  revalidatePath("/admin/verification")
  revalidatePath("/admin")
  return { ok: true }
}

export async function rejectVerification(input: unknown): Promise<ModResult> {
  const parsed = rejectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { data: req } = await ctx.supabase
    .from("verification_requests")
    .select("user_id")
    .eq("id", parsed.data.id)
    .maybeSingle<{ user_id: string }>()

  const { error } = await ctx.supabase
    .from("verification_requests")
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
      void sendVerificationRejectedEmail({
        to: recipient.email,
        name: recipient.name,
        reason: parsed.data.reason,
        lang: recipient.lang,
      })
    }
  }

  revalidatePath("/admin/verification")
  revalidatePath("/admin")
  return { ok: true }
}

/** Generate a short-lived signed URL for previewing a verification document. */
export async function getSignedVerificationUrl(
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
    .from("verifications")
    .createSignedUrl(path, ttlSeconds)
  if (error || !data) return { ok: false, error: error?.message ?? "sign_failed" }
  return { ok: true, url: data.signedUrl }
}

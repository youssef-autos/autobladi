"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { getRecipientById } from "@/lib/email/recipients"
import {
  sendAnnonceApprovedEmail,
  sendAnnonceRejectedEmail,
} from "@/lib/email/send"
import { pingIndexNow } from "@/lib/seo/indexnow"

export type AdminAnnonceResult = { ok: true } | { ok: false; error: string }

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
  revalidatePath("/admin/annonces")
  revalidatePath("/admin/annonces/pending")
  revalidatePath("/admin")
  revalidatePath("/annonces")
}

const idSchema = z.uuid()

// ---------------------------------------------------------------------------
// Change status (active / sold / expired / pending / draft)
// ---------------------------------------------------------------------------
const statusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["active", "sold", "expired", "pending", "draft"]),
})

export async function setAnnonceStatus(
  input: unknown,
): Promise<AdminAnnonceResult> {
  const parsed = statusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const patch: Record<string, unknown> = { status: parsed.data.status }
  let activatedSlug: string | null = null
  // When (re)activating, stamp a publish date if one is missing and clear any
  // previous rejection reason.
  if (parsed.data.status === "active") {
    const { data: current } = await ctx.supabase
      .from("annonces")
      .select("published_at, slug")
      .eq("id", parsed.data.id)
      .maybeSingle<{ published_at: string | null; slug: string }>()
    if (!current?.published_at) patch.published_at = new Date().toISOString()
    patch.rejection_reason = null
    activatedSlug = current?.slug ?? null
  }

  const { error } = await ctx.supabase
    .from("annonces")
    .update(patch as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }

  if (activatedSlug) await pingIndexNow([`/annonces/${activatedSlug}`])
  revalidate()
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Approve a pending/rejected annonce (publish it) + notify the seller
// ---------------------------------------------------------------------------
export async function approveAnnonceAdmin(
  input: unknown,
): Promise<AdminAnnonceResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { data: annonce } = await ctx.supabase
    .from("annonces")
    .select("id, title, slug, user_id")
    .eq("id", parsed.data)
    .maybeSingle<{ id: string; title: string; slug: string; user_id: string }>()

  const { error } = await ctx.supabase
    .from("annonces")
    .update({
      status: "active",
      published_at: new Date().toISOString(),
      rejection_reason: null,
    } as never)
    .eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }

  if (annonce) {
    await pingIndexNow([`/annonces/${annonce.slug}`])
    const recipient = await getRecipientById(annonce.user_id)
    if (recipient) {
      void sendAnnonceApprovedEmail({
        to: recipient.email,
        name: recipient.name,
        annonceTitle: annonce.title,
        annonceSlug: annonce.slug,
        lang: recipient.lang,
      })
    }
  }

  revalidate()
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Reject an annonce (with reason) + notify the seller
// ---------------------------------------------------------------------------
const rejectSchema = z.object({
  id: z.uuid(),
  reason: z.string().min(3).max(500),
})

export async function rejectAnnonceAdmin(
  input: unknown,
): Promise<AdminAnnonceResult> {
  const parsed = rejectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { data: annonce } = await ctx.supabase
    .from("annonces")
    .select("id, title, user_id")
    .eq("id", parsed.data.id)
    .maybeSingle<{ id: string; title: string; user_id: string }>()

  const { error } = await ctx.supabase
    .from("annonces")
    .update({
      status: "rejected",
      rejection_reason: parsed.data.reason,
    } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }

  if (annonce) {
    const recipient = await getRecipientById(annonce.user_id)
    if (recipient) {
      void sendAnnonceRejectedEmail({
        to: recipient.email,
        name: recipient.name,
        annonceTitle: annonce.title,
        annonceId: annonce.id,
        reason: parsed.data.reason,
        lang: recipient.lang,
      })
    }
  }

  revalidate()
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Permanently delete an annonce
// ---------------------------------------------------------------------------
export async function deleteAnnonceAdmin(
  input: unknown,
): Promise<AdminAnnonceResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error } = await ctx.supabase
    .from("annonces")
    .delete()
    .eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

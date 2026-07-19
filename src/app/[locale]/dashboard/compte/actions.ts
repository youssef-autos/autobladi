"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { getLocale } from "next-intl/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { changeEmailSchema, changePasswordSchema } from "@/lib/validations/auth"

export type AccountResult = { ok: true } | { ok: false; error: string }

async function siteOrigin() {
  const h = await headers()
  const fromHeader = h.get("origin")
  return fromHeader ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

const updateSchema = z.object({
  full_name: z.string().min(2).max(80),
  phone: z.string().max(20).nullable(),
  whatsapp: z.string().max(20).nullable(),
  city: z.string().max(80).nullable(),
  avatar_url: z.string().url().nullable().optional(),
})

export async function updateMyProfile(input: unknown) {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" } as const

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" } as const

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data as never)
    .eq("id", user.id)
  if (error) return { ok: false, error: error.message } as const

  revalidatePath("/dashboard", "layout")
  return { ok: true } as const
}

export async function deleteMyAccount(confirmation: unknown) {
  if (confirmation !== "DELETE") {
    return { ok: false, error: "confirmation_required" } as const
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" } as const

  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) return { ok: false, error: error.message } as const
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "delete_failed",
    } as const
  }

  // Sign out the session locally (cookies cleared by the auth helper).
  await supabase.auth.signOut()
  return { ok: true } as const
}

/**
 * Request an email change. Re-authenticates with the current password, then
 * sends a confirmation link to the CURRENT (already-verified) address rather
 * than the new one — that's what actually finalizes the change on this
 * Supabase project, and it doubles as proof the requester owns the account.
 */
export async function requestEmailChange(input: unknown): Promise<AccountResult> {
  const parsed = changeEmailSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !user.email) return { ok: false, error: "auth_required" }

  if (parsed.data.newEmail.toLowerCase() === user.email.toLowerCase()) {
    return { ok: false, error: "same_email" }
  }

  // Re-authenticate to confirm it's really the account owner making this
  // sensitive change (refreshes this browser's session cookies too).
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  })
  if (authError) return { ok: false, error: "wrong_password" }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: "email_change_current",
    email: user.email,
    newEmail: parsed.data.newEmail,
  })
  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) return { ok: false, error: "send_failed" }

  const origin = await siteOrigin()
  const locale = await getLocale()
  const lang = locale === "fr" ? "fr" : "ar"
  const confirmUrl = `${origin}/${locale}/auth/callback?token_hash=${tokenHash}&type=email_change&next=/dashboard/compte`

  const { sendEmailChangeEmail } = await import("@/lib/email/send")
  await sendEmailChangeEmail({
    to: user.email,
    newEmail: parsed.data.newEmail,
    confirmUrl,
    lang,
  })

  return { ok: true }
}

/** Change the password. Re-authenticates with the current password first. */
export async function changeMyPassword(input: unknown): Promise<AccountResult> {
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !user.email) return { ok: false, error: "auth_required" }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  })
  if (authError) return { ok: false, error: "wrong_password" }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })
  if (error) return { ok: false, error: error.message }

  return { ok: true }
}

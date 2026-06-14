"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validations/auth"

export type ActionResult =
  | { ok: true; data?: Record<string, unknown> }
  | { ok: false; error: string }

async function siteOrigin() {
  const h = await headers()
  const fromHeader = h.get("origin")
  return fromHeader ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

export async function signUp(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation.required" }
  }
  const { email, password, fullName, phone } = parsed.data

  const supabase = await createClient()
  const origin = await siteOrigin()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { full_name: fullName, phone },
    },
  })

  if (error) {
    if (error.message?.toLowerCase().includes("registered")) {
      return { ok: false, error: "auth.signUp.errorEmailExists" }
    }
    return { ok: false, error: "auth.signUp.errorGeneric" }
  }

  return { ok: true, data: { email } }
}

export async function signIn(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation.required" }
  }
  const { email, password } = parsed.data

  const supabase = await createClient()
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { ok: false, error: "auth.signIn.errorInvalid" }
  }

  // Look up the account type so the client can route admins straight to
  // /admin instead of the regular /dashboard. Best-effort: if the lookup
  // fails for any reason we just fall through and let the client use its
  // default redirect.
  let accountType: string | null = null
  const userId = signInData.user?.id
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", userId)
      .maybeSingle<{ account_type: string }>()
    accountType = profile?.account_type ?? null
  }

  return { ok: true, data: { accountType } }
}

export async function signOut(locale: string = "fr") {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}`)
}

export async function resetPassword(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation.invalidEmail" }
  }

  const supabase = await createClient()
  const origin = await siteOrigin()

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reinitialiser`,
  })

  // Always report success to avoid email enumeration.
  return { ok: true, data: { email: parsed.data.email } }
}

export async function updatePassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation.passwordTooShort" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { ok: false, error: "auth.resetPassword.errorInvalidLink" }
  }
  return { ok: true }
}

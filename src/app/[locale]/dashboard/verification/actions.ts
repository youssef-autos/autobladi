"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verificationFormSchema } from "@/lib/validations/verification"

export type VerificationResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string }

export async function submitVerification(
  input: unknown,
): Promise<VerificationResult> {
  const parsed = verificationFormSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? "validation" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  // Pro/admin only — gratuit accounts cannot submit
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, is_verified")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string; is_verified: boolean }>()
  if (!profile) return { ok: false, error: "profile_missing" }
  if (profile.account_type !== "pro" && profile.account_type !== "admin") {
    return { ok: false, error: "pro_required" }
  }
  if (profile.is_verified) return { ok: false, error: "already_verified" }

  // Only one active (pending/approved) request at a time — schema enforces
  // this with a partial unique index. Clean up any prior rejected requests so
  // the new one has a fresh history if you'd rather replace them. Here we
  // keep history and just insert a new pending row.
  const insertPayload = {
    user_id: user.id,
    company_name: parsed.data.company_name,
    manager_name: parsed.data.manager_name,
    rc_number: parsed.data.rc_number,
    professional_phone: parsed.data.professional_phone,
    address: parsed.data.address,
    rc_document_url: parsed.data.rc_document_path,
    id_card_url: parsed.data.id_card_path,
    status: "pending" as const,
  }
  const { data: inserted, error } = await supabase
    .from("verification_requests")
    .insert(insertPayload as never)
    .select("id")
    .single<{ id: string }>()
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "already_submitted" }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath("/dashboard/verification")
  return { ok: true, requestId: inserted.id }
}

/**
 * Server action returning a short-lived signed URL for a verification
 * document. Available to the document's owner OR to an admin (RLS on the
 * `verifications` bucket already enforces this; service-role bypass is used
 * to standardise the response time).
 */
export async function getSignedDocumentUrl(
  path: unknown,
  ttlSeconds: number = 60,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (typeof path !== "string" || !path) {
    return { ok: false, error: "invalid_path" }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  // Authorize: owner of the path OR admin
  const firstSegment = path.split("/")[0]
  let allowed = firstSegment === user.id
  if (!allowed) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .maybeSingle<{ account_type: string }>()
    allowed = profile?.account_type === "admin"
  }
  if (!allowed) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from("verifications")
    .createSignedUrl(path, ttlSeconds)
  if (error || !data) return { ok: false, error: error?.message ?? "sign_failed" }
  return { ok: true, url: data.signedUrl }
}

"use server"

import { headers } from "next/headers"

import { adInquirySchema, type AdInquiryValues } from "@/lib/validations/publicite"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendContactNotificationEmail } from "@/lib/email/send"

export type AdInquiryResult =
  | { ok: true }
  | { ok: false; error: "validation" | "rate_limited" | "server_error" }

// Tiny in-memory rate limiter — same idea as the AI route limiter, but a
// per-IP one-minute window since these are human-submitted contact forms.
const RECENT_IPS = new Map<string, number[]>()
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 3

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const arr = (RECENT_IPS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (arr.length >= MAX_PER_WINDOW) {
    RECENT_IPS.set(ip, arr)
    return true
  }
  arr.push(now)
  RECENT_IPS.set(ip, arr)
  // Opportunistic GC
  if (RECENT_IPS.size > 2000) {
    for (const [k, v] of RECENT_IPS) {
      if (v.every((t) => now - t > WINDOW_MS)) RECENT_IPS.delete(k)
    }
  }
  return false
}

export async function submitAdInquiry(
  input: AdInquiryValues,
): Promise<AdInquiryResult> {
  const parsed = adInquirySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "validation" }
  }

  // Best-effort IP for rate limiting. headers() reads the proxied client IP.
  const h = await headers()
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  if (rateLimited(ip)) {
    return { ok: false, error: "rate_limited" }
  }

  const { name, email, phone, company, message } = parsed.data
  // Compose a short, structured subject so admins can scan the inbox at a
  // glance — and a body that keeps the company name even though we don't
  // have a dedicated column for it.
  const subject = "إعلان تجاري"
  const composed =
    (company ? `[${company}] ` : "") + message.trim()

  try {
    const admin = createAdminClient()
    const { error } = await admin.from("contact_messages").insert({
      name,
      email,
      phone: phone || null,
      subject,
      message: composed,
    } as never)
    if (error) {
      return { ok: false, error: "server_error" }
    }

    // Fire-and-forget admin notification
    void sendContactNotificationEmail({
      fromName: name,
      fromEmail: email,
      fromPhone: phone || null,
      subject,
      message: composed,
    })

    return { ok: true }
  } catch {
    return { ok: false, error: "server_error" }
  }
}

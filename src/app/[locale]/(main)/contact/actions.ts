"use server"

import { headers } from "next/headers"

import { contactSchema, type ContactValues } from "@/lib/validations/contact"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendContactNotificationEmail } from "@/lib/email/send"

export type ContactResult =
  | { ok: true }
  | { ok: false; error: "validation" | "rate_limited" | "server_error" }

// Tiny in-memory per-IP rate limiter (same idea as the publicité form).
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
  if (RECENT_IPS.size > 2000) {
    for (const [k, v] of RECENT_IPS) {
      if (v.every((t) => now - t > WINDOW_MS)) RECENT_IPS.delete(k)
    }
  }
  return false
}

export async function submitContactMessage(
  input: ContactValues,
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "validation" }
  }

  const h = await headers()
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  if (rateLimited(ip)) {
    return { ok: false, error: "rate_limited" }
  }

  const { name, email, phone, subject, message } = parsed.data
  const cleanMessage = message.trim()
  const cleanSubject = subject?.trim() || null

  try {
    // Service-role insert — RLS allows anonymous inserts, but using the admin
    // client keeps it consistent with the publicité form.
    const admin = createAdminClient()
    const { error } = await admin.from("contact_messages").insert({
      name,
      email,
      phone: phone || null,
      subject: cleanSubject,
      message: cleanMessage,
    } as never)
    if (error) {
      return { ok: false, error: "server_error" }
    }

    // Fire-and-forget admin notification
    void sendContactNotificationEmail({
      fromName: name,
      fromEmail: email,
      fromPhone: phone || null,
      subject: cleanSubject ?? "Contact",
      message: cleanMessage,
    })

    return { ok: true }
  } catch {
    return { ok: false, error: "server_error" }
  }
}

"use server"

import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendReportNotificationEmail } from "@/lib/email/send"

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string }

const messageSchema = z.object({
  receiverId: z.uuid(),
  annonceId: z.uuid(),
  content: z.string().min(2).max(2000),
})

export async function sendMessage(input: unknown): Promise<ActionResult> {
  const parsed = messageSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "validation" }
  }
  const { receiverId, annonceId, content } = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }
  if (user.id === receiverId) return { ok: false, error: "self_message" }

  // Canonicalize user pair so we don't create duplicate conversations
  const [u1, u2] = [user.id, receiverId].sort()

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user1_id", u1)
    .eq("user2_id", u2)
    .eq("annonce_id", annonceId)
    .maybeSingle<{ id: string }>()

  let conversationId = existing?.id ?? null

  if (!conversationId) {
    const conversationInsert = {
      user1_id: u1,
      user2_id: u2,
      annonce_id: annonceId,
    }
    const { data: created, error: convError } = await supabase
      .from("conversations")
      .insert(conversationInsert as never)
      .select("id")
      .single<{ id: string }>()
    if (convError || !created) return { ok: false, error: "create_conversation" }
    conversationId = created.id
  }

  const messageInsert = {
    conversation_id: conversationId,
    sender_id: user.id,
    receiver_id: receiverId,
    annonce_id: annonceId,
    content,
  }
  const { error: msgError } = await supabase
    .from("messages")
    .insert(messageInsert as never)
  if (msgError) return { ok: false, error: "send" }

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() } as never)
    .eq("id", conversationId)

  // Advanced-stats event log (Pro dashboard). Recorded server-side so it can't
  // be spoofed from the client; best-effort — never fails the send.
  try {
    const admin = createAdminClient()
    await admin
      .from("ad_events")
      .insert({ ad_id: annonceId, event_type: "message", source: "direct" } as never)
  } catch {
    // ignore — table missing or transient error
  }

  return { ok: true }
}

const reportReasons = [
  "fake",
  "scam",
  "wrong_category",
  "sold",
  "inappropriate",
  "other",
] as const

const reportSchema = z.object({
  annonceId: z.uuid(),
  reason: z.enum(reportReasons),
  description: z.string().max(2000).optional(),
})

export async function reportAnnonce(input: unknown): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "validation" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const reportInsert = {
    annonce_id: parsed.data.annonceId,
    reporter_id: user?.id ?? null,
    reason: parsed.data.reason,
    description: parsed.data.description ?? null,
  }
  const { error } = await supabase.from("reports").insert(reportInsert as never)
  if (error) return { ok: false, error: "submit" }

  // Best-effort admin notification — needs service role to read annonce
  // title + reporter name regardless of RLS.
  void (async () => {
    try {
      const admin = createAdminClient()
      const [{ data: annonce }, { data: reporter }] = await Promise.all([
        admin
          .from("annonces")
          .select("title")
          .eq("id", parsed.data.annonceId)
          .maybeSingle<{ title: string }>(),
        user
          ? admin
              .from("profiles")
              .select("full_name")
              .eq("id", user.id)
              .maybeSingle<{ full_name: string | null }>()
          : Promise.resolve({ data: null }),
      ])
      await sendReportNotificationEmail({
        reporterName: reporter?.full_name ?? "Anonyme",
        annonceTitle: annonce?.title ?? "—",
        reason: parsed.data.reason,
        description: parsed.data.description ?? null,
      })
    } catch {
      // swallow — admin will see the report in the queue anyway
    }
  })()

  return { ok: true }
}

"use server"

import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type MessageActionResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string }

const sendSchema = z.object({
  conversationId: z.uuid(),
  content: z.string().min(1).max(2000),
})

export async function sendDashboardMessage(
  input: unknown,
): Promise<MessageActionResult> {
  const parsed = sendSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  type ConvoRow = {
    user1_id: string
    user2_id: string
    annonce_id: string | null
  }
  const { data: convo } = await supabase
    .from("conversations")
    .select("user1_id, user2_id, annonce_id")
    .eq("id", parsed.data.conversationId)
    .maybeSingle<ConvoRow>()
  if (!convo) return { ok: false, error: "conversation_not_found" }
  if (convo.user1_id !== user.id && convo.user2_id !== user.id) {
    return { ok: false, error: "forbidden" }
  }

  const receiverId = convo.user1_id === user.id ? convo.user2_id : convo.user1_id
  const insertPayload = {
    conversation_id: parsed.data.conversationId,
    sender_id: user.id,
    receiver_id: receiverId,
    annonce_id: convo.annonce_id,
    content: parsed.data.content,
  }
  const { data: inserted, error } = await supabase
    .from("messages")
    .insert(insertPayload as never)
    .select("id")
    .single<{ id: string }>()
  if (error) return { ok: false, error: error.message }

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() } as never)
    .eq("id", parsed.data.conversationId)

  return { ok: true, messageId: inserted.id }
}

export async function markConversationRead(
  conversationId: unknown,
): Promise<MessageActionResult> {
  const parsed = z.uuid().safeParse(conversationId)
  if (!parsed.success) return { ok: false, error: "validation" }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true } as never)
    .eq("conversation_id", parsed.data)
    .eq("receiver_id", user.id)
    .eq("is_read", false)
  if (error) return { ok: false, error: error.message }

  return { ok: true }
}

import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"

export type Participant = {
  id: string
  full_name: string | null
  avatar_url: string | null
  account_type: Tables<"profiles">["account_type"]
}

export type ConversationAnnonceRef = {
  id: string
  slug: string
  title: string
  price: number | null
  price_on_request: boolean
  main_image: string | null
}

export type ConversationSummary = {
  id: string
  last_message_at: string
  created_at: string
  other_user: Participant
  annonce: ConversationAnnonceRef | null
  last_message: { content: string; sender_id: string; created_at: string } | null
  unread_count: number
}

type ConversationRow = {
  id: string
  user1_id: string
  user2_id: string
  annonce_id: string | null
  last_message_at: string
  created_at: string
}

type ProfileRow = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "avatar_url" | "account_type"
>

type AnnonceRow = {
  id: string
  slug: string
  title: string
  price: number | null
  price_on_request: boolean
  annonce_images: { url: string; is_main: boolean; order_index: number }[] | null
}

type MessageRow = {
  id: string
  conversation_id: string | null
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

export async function listConversationsForUser(
  userId: string,
): Promise<ConversationSummary[]> {
  const supabase = await createClient()

  // 1. conversations
  const { data: convosData } = await supabase
    .from("conversations")
    .select("id, user1_id, user2_id, annonce_id, last_message_at, created_at")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("last_message_at", { ascending: false })

  const convos = (convosData ?? []) as unknown as ConversationRow[]
  if (convos.length === 0) return []

  const otherIds = Array.from(
    new Set(convos.map((c) => (c.user1_id === userId ? c.user2_id : c.user1_id))),
  )
  const annonceIds = Array.from(
    new Set(convos.map((c) => c.annonce_id).filter((id): id is string => !!id)),
  )
  const convoIds = convos.map((c) => c.id)

  // 2. profiles (other participants)
  const [{ data: profilesData }, { data: annoncesData }, { data: messagesData }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, account_type")
        .in("id", otherIds),
      annonceIds.length > 0
        ? supabase
            .from("annonces")
            .select(
              "id, slug, title, price, price_on_request, annonce_images(url, is_main, order_index)",
            )
            .in("id", annonceIds)
        : Promise.resolve({ data: [] as unknown as AnnonceRow[] }),
      supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, receiver_id, content, is_read, created_at",
        )
        .in("conversation_id", convoIds)
        .order("created_at", { ascending: false }),
    ])

  const profiles = (profilesData ?? []) as unknown as ProfileRow[]
  const annonces = (annoncesData ?? []) as unknown as AnnonceRow[]
  const messages = (messagesData ?? []) as unknown as MessageRow[]

  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const annonceById = new Map<string, ConversationAnnonceRef>(
    annonces.map((a) => {
      const imgs = a.annonce_images ?? []
      const main = imgs.find((i) => i.is_main) ?? imgs[0] ?? null
      return [
        a.id,
        {
          id: a.id,
          slug: a.slug,
          title: a.title,
          price: a.price_on_request ? null : a.price,
          price_on_request: a.price_on_request,
          main_image: main?.url ?? null,
        },
      ]
    }),
  )

  return convos.map((c) => {
    const otherId = c.user1_id === userId ? c.user2_id : c.user1_id
    const other = profileById.get(otherId)
    const annonce = c.annonce_id ? annonceById.get(c.annonce_id) ?? null : null
    const convoMessages = messages.filter((m) => m.conversation_id === c.id)
    const lastMessage = convoMessages[0]
    const unreadCount = convoMessages.filter(
      (m) => m.receiver_id === userId && !m.is_read,
    ).length

    return {
      id: c.id,
      last_message_at: c.last_message_at,
      created_at: c.created_at,
      other_user: other ?? {
        id: otherId,
        full_name: null,
        avatar_url: null,
        account_type: "gratuit",
      },
      annonce,
      last_message: lastMessage
        ? {
            content: lastMessage.content,
            sender_id: lastMessage.sender_id,
            created_at: lastMessage.created_at,
          }
        : null,
      unread_count: unreadCount,
    }
  })
}

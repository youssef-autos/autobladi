import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"

// ---------------------------------------------------------------------------
// Contact messages — public contact-form submissions (unread first)
// ---------------------------------------------------------------------------
export type AdminContactMessage = Tables<"contact_messages">

export async function listContactMessages(): Promise<AdminContactMessage[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("is_read", { ascending: true })
    .order("created_at", { ascending: false })
  return (data ?? []) as AdminContactMessage[]
}

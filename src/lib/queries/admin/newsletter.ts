import "server-only"

import { createClient } from "@/lib/supabase/server"

// ---------------------------------------------------------------------------
// Newsletter — subscriber stats
// ---------------------------------------------------------------------------
export type NewsletterStats = {
  subscribers: number
  unsubscribed: number
  total: number
}

export async function getNewsletterStats(): Promise<NewsletterStats> {
  const supabase = await createClient()
  const [totalRes, subRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("newsletter_subscribed", true),
  ])
  const total = totalRes.count ?? 0
  const subscribers = subRes.count ?? 0
  return { subscribers, unsubscribed: total - subscribers, total }
}

"use server"

import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { listNewsletterRecipients } from "@/lib/email/recipients"
import { sendNewsletterEmail } from "@/lib/email/send"
import type { NewsletterItem } from "@/lib/email/templates/NewsletterEmail"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

export type NewsletterSendResult =
  | { ok: true; sent: number; failed: number; recipients: number }
  | { ok: false; error: string }

async function adminClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  if (profile?.account_type !== "admin") return null
  return { supabase, adminId: user.id }
}

const sendSchema = z.object({
  heading: z.string().trim().min(3).max(150),
  introText: z.string().trim().min(3).max(1000),
  itemCount: z.coerce.number().int().min(0).max(12),
})

type AnnonceItemRow = {
  title: string
  slug: string
  description: string | null
  annonce_images: { url: string; is_main: boolean }[] | null
}

export async function sendNewsletterCampaign(
  input: unknown,
): Promise<NewsletterSendResult> {
  const parsed = sendSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  // Build the featured items from the latest active annonces.
  let items: NewsletterItem[] = []
  if (parsed.data.itemCount > 0) {
    const { data } = await ctx.supabase
      .from("annonces")
      .select("title, slug, description, annonce_images(url, is_main)")
      .eq("status", "active")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(parsed.data.itemCount)
    const rows = (data ?? []) as unknown as AnnonceItemRow[]
    items = rows.map((r) => {
      const main =
        (r.annonce_images ?? []).find((i) => i.is_main) ??
        (r.annonce_images ?? [])[0] ??
        null
      return {
        title: r.title,
        excerpt: r.description ? r.description.slice(0, 140) : null,
        url: `${SITE_URL}/ar/annonces/${r.slug}`,
        imageUrl: main?.url ?? null,
      }
    })
  }

  const recipients = await listNewsletterRecipients()
  if (recipients.length === 0) {
    return { ok: true, sent: 0, failed: 0, recipients: 0 }
  }

  let sent = 0
  let failed = 0

  // Send in batches to stay within provider rate limits.
  const BATCH = 10
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      batch.map((r) => {
        const unsubscribeUrl = r.unsubscribe_token
          ? `${SITE_URL}/${r.lang}/unsubscribe?token=${encodeURIComponent(r.unsubscribe_token)}`
          : `${SITE_URL}/${r.lang}/unsubscribe`
        return sendNewsletterEmail({
          to: r.email,
          preheader: parsed.data.heading,
          introHeading: parsed.data.heading,
          introText: parsed.data.introText,
          items,
          unsubscribeUrl,
          lang: r.lang,
        })
      }),
    )
    for (const res of results) {
      if (res.status === "fulfilled" && res.value.ok) sent++
      else failed++
    }
  }

  return { ok: true, sent, failed, recipients: recipients.length }
}

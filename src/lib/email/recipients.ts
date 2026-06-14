import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type EmailRecipient = {
  email: string
  name: string
  lang: "ar" | "fr"
  newsletter_subscribed: boolean
  unsubscribe_token: string | null
}

/**
 * Look up everything we need to send an email to a single user. `email`
 * lives on auth.users (service-role-only); the rest comes from public.profiles.
 * Returns null if either lookup fails so the caller can short-circuit.
 *
 * Locale isn't stored on profile — default to "ar" (the site's primary
 * locale). A future "preferred_language" column can override this.
 */
export async function getRecipientById(
  userId: string,
): Promise<EmailRecipient | null> {
  const admin = createAdminClient()

  const [{ data: authData }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin
      .from("profiles")
      .select("full_name, newsletter_subscribed, email_unsubscribe_token")
      .eq("id", userId)
      .maybeSingle<{
        full_name: string | null
        newsletter_subscribed: boolean
        email_unsubscribe_token: string | null
      }>(),
  ])

  const email = authData?.user?.email
  if (!email) return null

  return {
    email,
    name: profile?.full_name ?? email.split("@")[0] ?? "",
    lang: "ar",
    newsletter_subscribed: profile?.newsletter_subscribed ?? true,
    unsubscribe_token: profile?.email_unsubscribe_token ?? null,
  }
}

export type NewsletterRecipient = {
  id: string
  email: string
  name: string
  lang: "ar" | "fr"
  unsubscribe_token: string | null
  created_at: string
}

/**
 * Every profile opted into the newsletter, joined with the auth e-mail.
 * Emails live on auth.users (service-role only) so we page through
 * listUsers once and join by id rather than doing N getUserById calls.
 */
export async function listNewsletterRecipients(): Promise<NewsletterRecipient[]> {
  const admin = createAdminClient()

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email_unsubscribe_token, created_at")
    .eq("newsletter_subscribed", true)
  const profs = (profiles ?? []) as Array<{
    id: string
    full_name: string | null
    email_unsubscribe_token: string | null
    created_at: string
  }>
  if (profs.length === 0) return []

  const wanted = new Set(profs.map((p) => p.id))
  const emailById = new Map<string, string>()

  const perPage = 1000
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) break
    const users = data?.users ?? []
    for (const u of users) {
      if (u.email && wanted.has(u.id)) emailById.set(u.id, u.email)
    }
    if (users.length < perPage) break
  }

  return profs
    .map((p) => {
      const email = emailById.get(p.id) ?? ""
      return {
        id: p.id,
        email,
        name: p.full_name ?? email.split("@")[0] ?? "",
        lang: "ar" as const,
        unsubscribe_token: p.email_unsubscribe_token,
        created_at: p.created_at,
      }
    })
    .filter((r) => r.email)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

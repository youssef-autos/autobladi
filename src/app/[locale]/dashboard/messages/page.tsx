import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { MessagesPanel } from "@/components/messages/MessagesPanel"
import { createClient } from "@/lib/supabase/server"
import { listConversationsForUser } from "@/lib/queries/messages"

export const dynamic = "force-dynamic"

export default async function MessagesDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await getTranslations("messagesPage")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion?returnTo=/${locale}/dashboard/messages`)

  const conversations = await listConversationsForUser(user.id)

  return (
    <MessagesPanel conversations={conversations} currentUserId={user.id} />
  )
}

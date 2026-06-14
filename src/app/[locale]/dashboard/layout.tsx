import { redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/queries/dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Defensive check (middleware/proxy.ts already redirects, but keep this as
  // a safety net for any direct entry).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion?returnTo=/${locale}/dashboard`)

  const profile = await getCurrentProfile()

  const { count: unreadMessages } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("is_read", false)

  return (
    <div className="min-h-dvh bg-moroccan-sand-50/40">
      <DashboardSidebar
        profile={profile}
        email={user.email ?? null}
        unreadMessages={unreadMessages ?? 0}
      />
      <main className="lg:ps-64 min-h-dvh">{children}</main>
    </div>
  )
}

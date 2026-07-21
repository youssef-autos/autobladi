import { redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/queries/dashboard"
import { getSiteLogos } from "@/lib/queries/home"

export const dynamic = "force-dynamic"

// SEO: personal dashboard pages should never be indexed
export const metadata = {
  robots: { index: false, follow: false },
}

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
  let user: { id: string; email?: string } | null = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    console.error("[DashboardLayout] auth error — clearing session:", e)
  }
  if (!user) redirect(`/${locale}/auth/connexion?returnTo=/${locale}/dashboard`)

  const supabase = await createClient()
  const [profile, logos] = await Promise.all([
    getCurrentProfile(),
    getSiteLogos().catch(() => ({ light: null, dark: null })),
  ])

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
        logoUrl={logos.light}
      />
      <main className="lg:ps-64 min-h-dvh">{children}</main>
    </div>
  )
}

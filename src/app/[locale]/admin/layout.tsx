import { redirect } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { createClient } from "@/lib/supabase/server"
import { getAdminCounts } from "@/lib/queries/admin"
import type { Tables } from "@/types/database.types"

export const dynamic = "force-dynamic"

// SEO: admin should never be indexed
export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/auth/connexion?returnTo=/${locale}/admin`)
  }

  type ProfileSlice = Pick<
    Tables<"profiles">,
    "id" | "full_name" | "avatar_url" | "account_type"
  >
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, account_type")
    .eq("id", user.id)
    .maybeSingle<ProfileSlice>()

  // Strict gate — admin only
  if (!profile || profile.account_type !== "admin") {
    redirect(`/${locale}`)
  }

  const counts = await getAdminCounts()

  return (
    <div className="min-h-dvh bg-moroccan-sand-50/40">
      <AdminSidebar
        profile={{
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        }}
        counts={{
          pendingAnnonces: counts.pendingAnnonces,
          pendingReports: counts.pendingReports,
          pendingVerification: counts.pendingVerification,
          pendingSubs: counts.pendingSubs,
        }}
      />
      <main className="lg:ps-72 min-h-dvh">{children}</main>
    </div>
  )
}

import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus"
import { createClient } from "@/lib/supabase/server"
import {
  getMyActiveSubscription,
  listMyRequests,
} from "@/lib/queries/subscriptions"

export const dynamic = "force-dynamic"

export default async function DashboardAbonnementPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("dashboard.abonnementPage")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion`)

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()

  // Free accounts have nothing to manage here — send them to pick a plan.
  if (!profile || profile.account_type === "gratuit") {
    redirect(`/${locale}/dashboard/upgrade`)
  }

  const [current, history] = await Promise.all([
    getMyActiveSubscription(),
    listMyRequests(),
  ])

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      <SubscriptionStatus current={current} history={history} />
    </div>
  )
}

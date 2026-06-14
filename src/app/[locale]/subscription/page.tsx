import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { createClient } from "@/lib/supabase/server"
import {
  getMyActiveSubscription,
  listMyRequests,
} from "@/lib/queries/subscriptions"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "subscription.status" })
  // CRITICAL: this page must not appear in search results. It is intentionally
  // not linked from any public navigation.
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false, noimageindex: true },
  }
}

export default async function SubscriptionStatusPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("subscription.status")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth gate
  if (!user) {
    redirect(`/${locale}/auth/connexion?returnTo=/${locale}/subscription`)
  }

  type ProfileSlice = { account_type: string }
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<ProfileSlice>()

  // Free accounts: route to the upgrade page where they pick a plan.
  if (!profile || profile.account_type === "gratuit") {
    redirect(`/${locale}/dashboard/upgrade`)
  }

  const [current, history] = await Promise.all([
    getMyActiveSubscription(),
    listMyRequests(),
  ])

  return (
    <div className="py-8 md:py-12">
      <Container className="max-w-4xl">
        <header className="mb-6 space-y-2">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {t("currentTitle")}
          </h1>
          <GoldAccent />
        </header>

        <SubscriptionStatus current={current} history={history} />
      </Container>
    </div>
  )
}

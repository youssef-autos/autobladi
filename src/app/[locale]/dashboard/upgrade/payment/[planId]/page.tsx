import { ArrowLeft } from "lucide-react"
import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { PaymentForm } from "@/components/subscription/PaymentForm"
import { createClient } from "@/lib/supabase/server"
import {
  getBankSettings,
  getMyPendingRequest,
  getPlanById,
} from "@/lib/queries/subscriptions"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; planId: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "subscription.payment" })
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  }
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ locale: string; planId: string }>
}) {
  const { locale, planId } = await params
  setRequestLocale(locale)

  let t: Awaited<ReturnType<typeof getTranslations>>
  try {
    t = await getTranslations("subscription.payment")
  } catch (e) {
    console.error("[PaymentPage] translations error:", e)
    redirect(`/${locale}/dashboard/upgrade`)
  }

  let user: { id: string; email?: string | undefined } | null = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    console.error("[PaymentPage] auth error:", e)
  }

  if (!user) {
    redirect(
      `/${locale}/auth/connexion?returnTo=/${locale}/dashboard/upgrade/payment/${planId}`,
    )
  }

  const supabase = await createClient()

  type ProfileSlice = { account_type: string }
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<ProfileSlice>()

  if (profile?.account_type === "admin") {
    redirect(`/${locale}/dashboard`)
  }

  const [plan, bank, pending] = await Promise.all([
    getPlanById(planId),
    getBankSettings(),
    getMyPendingRequest(),
  ])

  if (!plan) {
    console.error("[PaymentPage] plan not found:", planId)
    redirect(`/${locale}/dashboard/upgrade`)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl">
      <header className="space-y-2">
        <Link
          href="/dashboard/upgrade"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:scale-x-[-1]" aria-hidden="true" />
          {t("back")}
        </Link>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {pending ? (
        <section className="rounded-2xl border border-moroccan-gold-500/40 bg-moroccan-gold-50/60 p-6 shadow-card">
          <p className="text-sm font-medium text-foreground">
            {t("alreadyPending")}
          </p>
          <Link
            href="/subscription"
            className="inline-flex mt-3 items-center text-sm font-medium text-moroccan-gold-700 hover:underline"
          >
            ← {t("back")}
          </Link>
        </section>
      ) : (
        <PaymentForm plan={plan} bank={bank} userId={user.id} />
      )}
    </div>
  )
}

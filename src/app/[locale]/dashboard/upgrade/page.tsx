import { BarChart3, Building2, Crown, Infinity as InfinityIcon, type LucideIcon } from "lucide-react"
import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { PlanCard } from "@/components/subscription/PlanCard"
import { Link } from "@/i18n/navigation"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { EmptyState } from "@/components/ui/EmptyState"
import { createClient } from "@/lib/supabase/server"
import {
  getMyPendingRequest,
  listActivePlans,
} from "@/lib/queries/subscriptions"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "subscription.upgrade" })
  // Explicitly tell search engines NOT to index — this is account-private.
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  }
}

export default async function UpgradePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("subscription.upgrade")
  const tFormat = await getTranslations("subscription.payment") // reuse currency formatting if needed
  void tFormat

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion?returnTo=/${locale}/dashboard/upgrade`)

  type ProfileSlice = { account_type: string }
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<ProfileSlice>()

  // Admins don't need subscriptions
  if (profile?.account_type === "admin") {
    redirect(`/${locale}/dashboard`)
  }

  const [plans, pending] = await Promise.all([
    listActivePlans(),
    getMyPendingRequest(),
  ])

  const features: Array<{ icon: LucideIcon; title: string; desc: string }> = [
    { icon: Building2, title: t("features.showroomTitle"), desc: t("features.showroomDesc") },
    { icon: InfinityIcon, title: t("features.unlimitedTitle"), desc: t("features.unlimitedDesc") },
    { icon: Crown, title: t("features.badgeTitle"), desc: t("features.badgeDesc") },
    { icon: BarChart3, title: t("features.statsTitle"), desc: t("features.statsDesc") },
  ]

  // Highlight the admin-chosen "most popular" plan; fall back to the middle one.
  const popularIndex = plans.findIndex((p) => p.is_popular)
  const featuredIndex = popularIndex >= 0 ? popularIndex : plans.length >= 3 ? 1 : -1

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-10 max-w-6xl">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-moroccan-gradient text-white p-8 md:p-12">
        <div
          className="absolute -end-20 -top-20 size-64 rounded-full bg-moroccan-gold-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-2xl space-y-3">
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="text-white/85">{t("heroSubtitle")}</p>
        </div>

        <ul className="relative mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <li
              key={f.title}
              className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4"
            >
              <f.icon
                className="size-5 text-moroccan-gold-500 mb-2"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-white/70 mt-1">{f.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Pending request banner */}
      {pending && (
        <section className="rounded-2xl border border-moroccan-gold-500/40 bg-moroccan-gold-50/60 p-6 shadow-card flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">{t("pendingTitle")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("pendingDesc", {
                date: new Date(pending.created_at).toLocaleDateString(locale),
              })}
            </p>
          </div>
          <Link
            href="/dashboard/abonnement"
            className="inline-flex items-center h-10 px-4 rounded-xl border border-moroccan-gold-500/60 bg-background text-sm font-medium text-moroccan-gold-700 hover:bg-moroccan-gold-50"
          >
            {t("viewStatus")} →
          </Link>
        </section>
      )}

      {/* Plans */}
      <section className="space-y-6">
        <header className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t("plansTitle")}
          </h2>
          <GoldAccent className="mx-auto" />
          <p className="text-sm text-muted-foreground">{t("plansSubtitle")}</p>
        </header>

        {plans.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
            <EmptyState
              icon={Crown}
              title={t("noPlans")}
              description={t("noPlansDesc")}
            />
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {plans.map((plan, idx) => (
              <li key={plan.id} className="flex">
                <PlanCard plan={plan} featured={idx === featuredIndex} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

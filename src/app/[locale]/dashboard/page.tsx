import { Eye, Heart, Mail, Tag, TrendingUp } from "lucide-react"
import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ActivityChart } from "@/components/dashboard/ActivityChartWrapper"
import { AdvancedStats } from "@/components/dashboard/AdvancedStatsWrapper"
import { AlertsList } from "@/components/dashboard/AlertsList"
import { ProStatsLocked } from "@/components/dashboard/ProStatsLocked"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Link } from "@/i18n/navigation"
import {
  getCurrentProfile,
  getDashboardStats,
  getExpiringAnnonces,
  getTopAnnoncesByViews,
  listMyAnnonces,
} from "@/lib/queries/dashboard"
import { createClient } from "@/lib/supabase/server"
import { formatPrice } from "@/lib/utils/format"
import type { Locale } from "@/i18n/routing"

export const dynamic = "force-dynamic"

export default async function DashboardHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("dashboard.home")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion`)

  const [profile, stats, topAnnonces, expiring, latest] = await Promise.all([
    getCurrentProfile(),
    getDashboardStats(user.id),
    getTopAnnoncesByViews(user.id),
    getExpiringAnnonces(user.id),
    listMyAnnonces(user.id).then((rows) => rows.slice(0, 5)),
  ])

  const needsVerification =
    (profile?.account_type === "pro" || profile?.account_type === "admin") &&
    !profile.is_verified

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {profile?.full_name
            ? t("welcome", { name: profile.full_name })
            : t("welcomeAnon")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatsCard
          icon={Tag}
          label={t("stats.totalAnnonces")}
          value={stats.totalAnnonces}
          accent="red"
        />
        <StatsCard
          icon={TrendingUp}
          label={t("stats.activeAnnonces")}
          value={stats.activeAnnonces}
          accent="mint"
        />
        <StatsCard
          icon={Eye}
          label={t("stats.views")}
          value={stats.totalViews}
          accent="gold"
        />
        <StatsCard
          icon={Mail}
          label={t("stats.messages")}
          value={stats.unreadMessages}
          accent="red"
        />
        <StatsCard
          icon={Heart}
          label={t("stats.favorites")}
          value={stats.favoritesReceived}
          accent="default"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Chart + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <ActivityChart data={topAnnonces} />
        <AlertsList expiring={expiring} needsVerification={needsVerification} />
      </div>

      {/* Recent annonces */}
      <section className="rounded-2xl bg-card border border-border p-6 shadow-soft">
        <header className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">{t("recent.annoncesTitle")}</h2>
          <Link
            href="/dashboard/annonces"
            className="text-xs font-medium text-moroccan-red-500 hover:underline"
          >
            {t("recent.viewAll")} →
          </Link>
        </header>
        {latest.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {t("recent.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {latest.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="size-12 rounded-lg bg-moroccan-sand-50 overflow-hidden shrink-0">
                  {row.main_image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={row.main_image}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {row.title}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatPrice(row.price, locale as Locale)} · {row.views_count}{" "}
                    {t("chart.viewsLabel")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Advanced statistics — full widget for Pro, locked teaser for free */}
      {profile?.account_type === "pro" || profile?.account_type === "admin" ? (
        <AdvancedStats />
      ) : (
        <ProStatsLocked />
      )}
    </div>
  )
}

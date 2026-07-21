import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Flag,
  Sparkles,
  Store,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { PendingShowroomsWidget } from "@/components/admin/PendingShowroomsWidget"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Card } from "@/components/ui/Card"
import { getAdminCounts, listPendingShowroomsAdmin } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  void locale
  const t = await getTranslations("adminPanel.dashboard")
  const [counts, pendingShowrooms] = await Promise.all([
    getAdminCounts(),
    listPendingShowroomsAdmin(5),
  ])

  const stats: Array<{
    label: string
    value: number
    hint?: string
    icon: LucideIcon
    accent: React.ComponentProps<typeof StatsCard>["accent"]
    href?: string
    urgent?: boolean
  }> = [
    {
      label: t("stats.users"),
      value: counts.users,
      hint: t("stats.newUsersMonth", { count: counts.newUsersMonth }),
      icon: Users,
      accent: "default",
      href: "/admin/users",
    },
    {
      label: t("stats.totalAnnonces"),
      value: counts.totalAnnonces,
      icon: Tag,
      accent: "red",
      href: "/admin/annonces",
    },
    {
      label: t("stats.activeAnnonces"),
      value: counts.activeAnnonces,
      icon: CheckCircle2,
      accent: "mint",
      href: "/admin/annonces",
    },
    {
      label: t("stats.pendingAnnonces"),
      value: counts.pendingAnnonces,
      icon: Clock,
      accent: "gold",
      href: "/admin/annonces/pending",
      urgent: counts.pendingAnnonces > 0,
    },
    {
      label: t("stats.professionnels"),
      value: counts.professionnels,
      icon: Building2,
      accent: "default",
      href: "/admin/showrooms",
    },
    {
      label: t("stats.pendingShowrooms"),
      value: counts.pendingShowrooms,
      icon: Store,
      accent: "gold",
      href: "/admin/showrooms",
      urgent: counts.pendingShowrooms > 0,
    },
    {
      label: t("stats.pendingReports"),
      value: counts.pendingReports,
      icon: Flag,
      accent: "red",
      href: "/admin/reports",
      urgent: counts.pendingReports > 0,
    },
  ]

  const attentionItems = [
    {
      count: counts.pendingAnnonces,
      label: t("stats.pendingAnnonces"),
      href: "/admin/annonces/pending",
      icon: Clock,
    },
    {
      count: counts.pendingShowrooms,
      label: t("stats.pendingShowrooms"),
      href: "/admin/showrooms",
      icon: Store,
    },
    {
      count: counts.pendingReports,
      label: t("stats.pendingReports"),
      href: "/admin/reports",
      icon: Flag,
    },
  ].filter((item) => item.count > 0)

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) =>
          stat.href ? (
            <Link key={stat.label} href={stat.href} className="block">
              <StatsCard
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                hint={stat.hint}
                accent={stat.accent}
                className={cn(
                  "transition-all hover:-translate-y-0.5 hover:shadow-card",
                  stat.urgent && "ring-2 ring-moroccan-red-500/30",
                )}
              />
            </Link>
          ) : (
            <StatsCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              accent={stat.accent}
            />
          ),
        )}
      </div>

      {/* Needs attention */}
      <Card as="section" padding="none" className="p-6">
        <header className="flex items-center gap-2 mb-4">
          <AlertTriangle
            className="size-5 text-moroccan-gold-700"
            aria-hidden="true"
          />
          <h2 className="font-semibold text-foreground">{t("needsAttention")}</h2>
        </header>

        {attentionItems.length === 0 ? (
          <p className="inline-flex items-center gap-2 text-sm text-moroccan-mint-500">
            <Sparkles className="size-4" aria-hidden="true" />
            {t("noAttention")}
          </p>
        ) : (
          <ul className="space-y-2">
            {attentionItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 hover:bg-moroccan-sand-50 transition-colors"
                  >
                    <span className="inline-flex items-center gap-3">
                      <Icon
                        className="size-4 text-moroccan-gold-700"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-moroccan-red-500 text-white text-xs font-bold tabular-nums">
                        {item.count}
                      </span>
                      <span className="text-xs text-moroccan-red-500">
                        {t("review")} →
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {/* Showrooms awaiting approval — quick-approve without leaving the dashboard */}
      <PendingShowroomsWidget rows={pendingShowrooms} total={counts.pendingShowrooms} />
    </div>
  )
}

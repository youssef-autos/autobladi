"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Users,
  UserPlus,
  Car,
  Eye,
  Mail,
  Building2,
  TrendingUp,
  MapPin,
  Printer,
  MousePointerClick,
  Percent,
} from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

import type { AdsReportData } from "@/lib/queries/admin"

type Props = {
  report: AdsReportData
  generatedAt: string
}

const MONTH_NAMES_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
]
const MONTH_NAMES_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
]

function formatMonth(key: string, locale: string) {
  const [, m] = key.split("-")
  const idx = parseInt(m, 10) - 1
  return locale === "ar" ? MONTH_NAMES_AR[idx] : MONTH_NAMES_FR[idx]
}

export function AdsReportView({ report, generatedAt }: Props) {
  const t = useTranslations("adminPanel.adsReport")
  const fmt = useFormatter()
  const num = (n: number) => fmt.number(n)

  // Build chart data with localized month labels — locale detection via document.dir
  const locale =
    typeof document !== "undefined" && document.documentElement.dir === "rtl"
      ? "ar"
      : "fr"

  const growthData = useMemo(
    () =>
      report.monthlyGrowth.map((m) => ({
        month: formatMonth(m.month, locale),
        users: m.users,
        listings: m.listings,
      })),
    [report.monthlyGrowth, locale],
  )

  const topCitiesMax = report.topCities[0]?.count ?? 1

  const totalImpressions = report.placementStats.reduce(
    (s, p) => s + p.impressions,
    0,
  )
  const totalClicks = report.placementStats.reduce((s, p) => s + p.clicks, 0)
  const overallCtr =
    totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <p className="text-xs text-muted-foreground">
          {t("generatedAt")}:{" "}
          <span className="font-medium text-foreground">{generatedAt}</span>
        </p>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium shadow-card hover:bg-moroccan-sand-50 transition-colors"
        >
          <Printer className="size-4" />
          {t("print")}
        </button>
      </div>

      {/* ── Section 1: Reach ── */}
      <section>
        <SectionTitle icon={TrendingUp} title={t("reach.title")} />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <ReachCard
            icon={Users}
            label={t("reach.totalUsers")}
            value={num(report.reach.totalUsers)}
            tone="red"
          />
          <ReachCard
            icon={UserPlus}
            label={t("reach.newUsersMonth")}
            value={`+${num(report.reach.newUsersThisMonth)}`}
            tone="gold"
            note={t("reach.thisMonth")}
          />
          <ReachCard
            icon={Car}
            label={t("reach.activeListings")}
            value={num(report.reach.totalActiveListings)}
            tone="mint"
          />
          <ReachCard
            icon={Eye}
            label={t("reach.pageViews")}
            value={num(report.reach.totalPageViews)}
            tone="red"
          />
          <ReachCard
            icon={Mail}
            label={t("reach.newsletter")}
            value={num(report.reach.newsletterSubscribers)}
            tone="gold"
          />
          <ReachCard
            icon={Building2}
            label={t("reach.proUsers")}
            value={num(report.reach.proUsers)}
            tone="mint"
          />
        </div>
      </section>

      {/* ── Section 2: Ad Performance totals ── */}
      <section>
        <SectionTitle icon={MousePointerClick} title={t("adPerf.title")} />
        <div className="grid grid-cols-3 gap-4 mt-4">
          <ReachCard
            icon={Eye}
            label={t("adPerf.impressions")}
            value={num(totalImpressions)}
            tone="mint"
          />
          <ReachCard
            icon={MousePointerClick}
            label={t("adPerf.clicks")}
            value={num(totalClicks)}
            tone="red"
          />
          <ReachCard
            icon={Percent}
            label={t("adPerf.ctr")}
            value={`${overallCtr.toFixed(2)}%`}
            tone="gold"
          />
        </div>
      </section>

      {/* ── Section 3: Monthly growth chart ── */}
      <section>
        <SectionTitle icon={TrendingUp} title={t("growth.title")} />
        <div className="mt-4 rounded-2xl border border-border bg-card shadow-card p-4">
          <p className="text-xs text-muted-foreground mb-4">
            {t("growth.subtitle")}
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={growthData}
                margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
                barGap={2}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(0 0% 90%)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(0 0% 60%)"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(0 0% 60%)"
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(193, 39, 45, 0.06)" }}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid hsl(0 0% 90%)",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="users"
                  name={t("growth.users")}
                  fill="#c1272d"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="listings"
                  name={t("growth.listings")}
                  fill="#d4a00e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <Legend color="#c1272d" label={t("growth.users")} />
            <Legend color="#d4a00e" label={t("growth.listings")} />
          </div>
        </div>
      </section>

      {/* ── Section 4: Top cities ── */}
      {report.topCities.length > 0 && (
        <section>
          <SectionTitle icon={MapPin} title={t("cities.title")} />
          <div className="mt-4 rounded-2xl border border-border bg-card shadow-card p-4 space-y-3">
            {report.topCities.map((c, i) => (
              <div key={c.city} className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="w-24 shrink-0 text-sm font-medium text-foreground truncate">
                  {c.city}
                </span>
                <div className="flex-1 bg-moroccan-sand-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-moroccan-red-500 transition-all"
                    style={{ width: `${(c.count / topCitiesMax) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-end text-xs tabular-nums text-muted-foreground">
                  {num(c.count)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 5: Per-placement performance ── */}
      <section className="print:break-before-page">
        <SectionTitle icon={Eye} title={t("placements.title")} />
        <div className="mt-4 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3">
                    {t("placements.name")}
                  </th>
                  <th className="text-end px-4 py-3">
                    {t("placements.impressions")}
                  </th>
                  <th className="text-end px-4 py-3">
                    {t("placements.clicks")}
                  </th>
                  <th className="text-end px-4 py-3">
                    {t("placements.ctr")}
                  </th>
                  <th className="text-end px-4 py-3">
                    {t("placements.activeAds")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.placementStats.map((p) => (
                  <tr
                    key={p.slug}
                    className="border-t border-border hover:bg-moroccan-sand-50/40"
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {p.name}
                    </td>
                    <td className="px-4 py-2.5 text-end tabular-nums">
                      {num(p.impressions)}
                    </td>
                    <td className="px-4 py-2.5 text-end tabular-nums">
                      {num(p.clicks)}
                    </td>
                    <td className="px-4 py-2.5 text-end tabular-nums text-moroccan-gold-700 font-medium">
                      {p.ctr.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-end">
                      {p.activeAds > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-moroccan-mint-500/10 px-2 py-0.5 text-xs font-medium text-moroccan-mint-700">
                          {p.activeAds} {t("placements.active")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("placements.available")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center pb-4">
        {t("footer")}
      </p>
    </div>
  )
}

// ── Sub-components ──

const TONES = {
  mint: "bg-moroccan-mint-500/10 text-moroccan-mint-600",
  red: "bg-moroccan-red-500/10 text-moroccan-red-600",
  gold: "bg-moroccan-gold-500/15 text-moroccan-gold-700",
} as const

function ReachCard({
  icon: Icon,
  label,
  value,
  tone,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: keyof typeof TONES
  note?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <span
        className={`inline-flex size-9 items-center justify-center rounded-lg ${TONES[tone]}`}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-2xl font-bold text-foreground tabular-nums">
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {note && <p className="text-[10px] text-muted-foreground/70 mt-1">{note}</p>}
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex size-7 items-center justify-center rounded-lg bg-moroccan-red-500/10 text-moroccan-red-600">
        <Icon className="size-4" />
      </span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 rounded-sm"
        style={{ background: color }}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

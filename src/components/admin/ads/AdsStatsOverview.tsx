"use client"

import { useMemo } from "react"
import { Eye, MousePointerClick, Percent, Power } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

import type { AdminAdRow } from "@/lib/queries/admin"

type Props = {
  ads: AdminAdRow[]
}

/**
 * Aggregate ad-performance dashboard: total impressions, clicks, overall CTR
 * and active count, plus a per-placement breakdown. Computed from the ads list
 * the page already loads (no extra query). Impressions/clicks are incremented
 * by the public beacon API routes.
 */
export function AdsStatsOverview({ ads }: Props) {
  const t = useTranslations("adminPanel.adsPage.overview")
  const fmt = useFormatter()

  const totals = useMemo(() => {
    let impressions = 0
    let clicks = 0
    let active = 0
    for (const a of ads) {
      impressions += a.impressions
      clicks += a.clicks
      if (a.is_active) active += 1
    }
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    return { impressions, clicks, active, ctr }
  }, [ads])

  const byPlacement = useMemo(() => {
    const map = new Map<
      string,
      { name: string; impressions: number; clicks: number; ads: number }
    >()
    for (const a of ads) {
      const name = a.placement?.name ?? "—"
      const cur = map.get(name) ?? { name, impressions: 0, clicks: 0, ads: 0 }
      cur.impressions += a.impressions
      cur.clicks += a.clicks
      cur.ads += 1
      map.set(name, cur)
    }
    return [...map.values()].sort((a, b) => b.impressions - a.impressions)
  }, [ads])

  if (ads.length === 0) return null

  const num = (n: number) => fmt.number(n)

  return (
    <section className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          label={t("totalImpressions")}
          value={num(totals.impressions)}
          tone="mint"
        />
        <StatCard
          icon={MousePointerClick}
          label={t("totalClicks")}
          value={num(totals.clicks)}
          tone="red"
        />
        <StatCard
          icon={Percent}
          label={t("ctr")}
          value={`${totals.ctr.toFixed(2)}%`}
          tone="gold"
        />
        <StatCard
          icon={Power}
          label={t("activeAds")}
          value={`${totals.active} / ${ads.length}`}
          tone="mint"
        />
      </div>

      {/* Per-placement breakdown */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {t("byPlacement")}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-start px-4 py-2.5">{t("placement")}</th>
                <th className="text-start px-4 py-2.5 w-20">{t("ads")}</th>
                <th className="text-start px-4 py-2.5">{t("impressions")}</th>
                <th className="text-start px-4 py-2.5">{t("clicks")}</th>
                <th className="text-start px-4 py-2.5 w-24">{t("ctr")}</th>
              </tr>
            </thead>
            <tbody>
              {byPlacement.map((p) => {
                const ctr =
                  p.impressions > 0
                    ? ((p.clicks / p.impressions) * 100).toFixed(2)
                    : "0.00"
                return (
                  <tr
                    key={p.name}
                    className="border-t border-border hover:bg-moroccan-sand-50/40"
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {p.name}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      {p.ads}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{num(p.impressions)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{num(p.clicks)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-moroccan-gold-700">
                      {ctr}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

const TONES = {
  mint: "bg-moroccan-mint-500/10 text-moroccan-mint-600",
  red: "bg-moroccan-red-500/10 text-moroccan-red-600",
  gold: "bg-moroccan-gold-500/15 text-moroccan-gold-700",
} as const

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: keyof typeof TONES
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
    </div>
  )
}

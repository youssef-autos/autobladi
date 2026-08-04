"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  BarChart3,
  Eye,
  Mail,
  Phone,
  TrendingUp,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { StatsCard } from "@/components/dashboard/StatsCard"
import { Link } from "@/i18n/navigation"
import type { AdvancedStatsPayload } from "@/app/api/dashboard/stats/route"
import { cn } from "@/lib/utils"

/**
 * Pro-only advanced statistics widget. Fetches /api/dashboard/stats (which
 * re-checks the Pro plan server-side) and renders summary cards, a daily
 * views line chart, the traffic-source distribution and a per-annonce table
 * with a low-conversion warning.
 */
export function AdvancedStats() {
  const t = useTranslations("dashboard.advancedStats")
  const locale = useLocale()
  const [days, setDays] = useState<7 | 30>(30)
  const [stats, setStats] = useState<AdvancedStatsPayload | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")

  const load = useCallback((d: 7 | 30) => {
    setState("loading")
    fetch(`/api/dashboard/stats?days=${d}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as { ok: boolean; stats: AdvancedStatsPayload }
        if (!json.ok) throw new Error("bad_payload")
        setStats(json.stats)
        setState("ready")
      })
      .catch(() => setState("error"))
  }, [])

  useEffect(() => {
    // load() sets the loading flag synchronously before its fetch, by design
    // (the spinner should show immediately). Standard fetch-on-mount-and-on-
    // change effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(days)
  }, [days, load])

  const dayFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar-MA-u-nu-latn" : "fr-FR", {
        day: "numeric",
        month: "short",
      }),
    [locale],
  )
  const pct = (v: number) => `${Math.round(v * 100)}%`

  const chartData = useMemo(
    () =>
      (stats?.daily ?? []).map((d) => ({
        ...d,
        label: dayFmt.format(new Date(`${d.date}T00:00:00Z`)),
      })),
    [stats, dayFmt],
  )

  const sourceData = useMemo(
    () =>
      (stats?.sources ?? []).map((s) => ({
        ...s,
        label: t(`sources.${s.source}` as never),
      })),
    [stats, t],
  )

  const hasAnyData = (stats?.totals.views ?? 0) > 0

  return (
    <section className="space-y-4">
      {/* Header + 7/30 filter */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="inline-flex items-center rounded-xl border border-border bg-card p-1">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-semibold transition-colors",
                days === d
                  ? "bg-moroccan-gradient text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d === 7 ? t("range7") : t("range30")}
            </button>
          ))}
        </div>
      </header>

      {state === "error" ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{t("error")}</p>
          <button
            type="button"
            onClick={() => load(days)}
            className="inline-flex h-9 px-4 items-center rounded-xl border border-border text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
          >
            {t("retry")}
          </button>
        </div>
      ) : state === "loading" || !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard icon={Eye} label={t("cards.views")} value={stats.totals.views} accent="gold" />
            <StatsCard icon={Mail} label={t("cards.messages")} value={stats.totals.messages} accent="red" />
            <StatsCard
              icon={Phone}
              label={t("cards.contacts")}
              value={stats.totals.phoneClicks + stats.totals.whatsappClicks}
              hint={t("cards.contactsHint", {
                phone: stats.totals.phoneClicks,
                whatsapp: stats.totals.whatsappClicks,
              })}
              accent="mint"
            />
            <StatsCard
              icon={TrendingUp}
              label={t("cards.conversion")}
              value={pct(stats.totals.conversion)}
              accent="default"
            />
          </div>

          {!hasAnyData && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <BarChart3 className="size-8 mx-auto text-moroccan-sand-200 mb-2" strokeWidth={1.2} aria-hidden="true" />
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t("empty")}</p>
            </div>
          )}

          {hasAnyData && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
              {/* Daily views line chart */}
              <div className="rounded-2xl bg-card border border-border p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  {t("chart.title")}
                </h3>
                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(0 0% 90%)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        stroke="hsl(0 0% 60%)"
                        interval="preserveStartEnd"
                        minTickGap={24}
                      />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(0 0% 60%)" allowDecimals={false} width={32} />
                      <Tooltip
                        cursor={{ stroke: "rgba(193, 39, 45, 0.25)" }}
                        contentStyle={{ borderRadius: 12, border: "1px solid hsl(0 0% 90%)", fontSize: 12 }}
                        formatter={(value) => [value as number, t("chart.viewsLabel")]}
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#c1272d"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Traffic sources */}
              <div className="rounded-2xl bg-card border border-border p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  {t("sources.title")}
                </h3>
                {sourceData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">{t("empty")}</p>
                ) : (
                  <div className="h-64 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sourceData} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={92}
                          tick={{ fontSize: 11 }}
                          stroke="hsl(0 0% 60%)"
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(193, 39, 45, 0.06)" }}
                          contentStyle={{ borderRadius: 12, border: "1px solid hsl(0 0% 90%)", fontSize: 12 }}
                          formatter={(value, _name, item) => [
                            `${value} (${(item?.payload as { percent?: number })?.percent ?? 0}%)`,
                            t("chart.viewsLabel"),
                          ]}
                        />
                        <Bar dataKey="count" fill="#e5c547" radius={[0, 6, 6, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Per-annonce table */}
          {stats.perAnnonce.length > 0 && (
            <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
              <h3 className="text-sm font-semibold text-foreground px-5 pt-5 pb-3">
                {t("table.title")}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-start px-5 py-2.5">{t("table.annonce")}</th>
                      <th className="text-start px-4 py-2.5">{t("table.views")}</th>
                      <th className="text-start px-4 py-2.5">{t("table.interactions")}</th>
                      <th className="text-start px-4 py-2.5">{t("table.conversion")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.perAnnonce.map((a) => {
                      const interactions = a.phoneClicks + a.whatsappClicks + a.messages
                      const lowConversion = a.views >= 50 && a.conversion < 0.02
                      return (
                        <tr key={a.id} className="border-t border-border">
                          <td className="px-5 py-3 max-w-[320px]">
                            <Link
                              href={`/annonces/${a.slug}`}
                              className="font-medium text-foreground hover:text-moroccan-red-500 line-clamp-1"
                            >
                              {a.title}
                            </Link>
                            {lowConversion && (
                              <p className="flex items-center gap-1.5 mt-1 text-xs text-moroccan-gold-700">
                                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                                {t("table.lowConversionHint")}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 tabular-nums">{a.views}</td>
                          <td className="px-4 py-3 tabular-nums">{interactions}</td>
                          <td className="px-4 py-3 tabular-nums font-semibold">
                            {pct(a.conversion)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

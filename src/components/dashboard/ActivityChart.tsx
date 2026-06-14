"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Eye } from "lucide-react"
import { useTranslations } from "next-intl"

import type { ChartPoint } from "@/lib/queries/dashboard"

type Props = {
  data: ChartPoint[]
}

export function ActivityChart({ data }: Props) {
  const t = useTranslations("dashboard.home.chart")

  const hasData = data.length > 0
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, name: d.name.length > 18 ? `${d.name.slice(0, 17)}…` : d.name })),
    [data],
  )

  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-soft">
      <header className="mb-4">
        <h2 className="font-semibold text-foreground">{t("title")}</h2>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </header>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground space-y-2">
          <Eye className="size-10 text-moroccan-sand-200" strokeWidth={1.2} aria-hidden="true" />
          <p className="text-sm max-w-xs">{t("empty")}</p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(0 0% 90%)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="hsl(0 0% 60%)"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(0 0% 60%)" allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(193, 39, 45, 0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(0 0% 90%)",
                  fontSize: 12,
                }}
                formatter={(value) => [value as number, t("viewsLabel")]}
              />
              <Bar dataKey="views" fill="#c1272d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

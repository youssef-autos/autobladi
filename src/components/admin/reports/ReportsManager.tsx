"use client"

import { useMemo, useState } from "react"
import { Flag } from "lucide-react"
import { useTranslations } from "next-intl"

import { ReportRow } from "@/components/admin/reports/ReportRow"
import { EmptyState } from "@/components/ui/EmptyState"
import type { AdminReportRow } from "@/lib/queries/admin"
import type { RequestStatus } from "@/types/database.types"
import { cn } from "@/lib/utils"

type Props = {
  reports: AdminReportRow[]
}

type StatusFilter = "all" | RequestStatus

const STATUS_TABS: StatusFilter[] = ["all", "pending", "approved", "rejected"]

export function ReportsManager({ reports }: Props) {
  const t = useTranslations("adminPanel.reportsPage")
  const [status, setStatus] = useState<StatusFilter>("pending")

  const counts = useMemo(() => {
    const map = new Map<StatusFilter, number>()
    map.set("all", reports.length)
    for (const r of reports) {
      map.set(r.status, (map.get(r.status) ?? 0) + 1)
    }
    return map
  }, [reports])

  const filtered = useMemo(() => {
    if (status === "all") return reports
    return reports.filter((r) => r.status === status)
  }, [reports, status])

  return (
    <div className="space-y-5">
      {/* Status tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_TABS.map((s) => {
          const count = counts.get(s) ?? 0
          const isActive = status === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm font-medium transition-colors",
                isActive
                  ? "border-moroccan-red-500/40 bg-moroccan-red-50 text-moroccan-red-600"
                  : "border-border bg-card text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground",
              )}
            >
              {t(`statusTabs.${s}`)}
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] tabular-nums",
                  isActive
                    ? "bg-moroccan-red-500 text-white"
                    : "bg-moroccan-sand-100 text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {t("count", { count: filtered.length })}
      </p>

      {/* Table */}
      {reports.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState icon={Flag} title={t("empty")} description={t("emptyDesc")} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-8 shadow-card text-center text-sm text-muted-foreground">
          {t("noResults")}
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3 min-w-[220px]">
                    {t("columns.annonce")}
                  </th>
                  <th className="text-start px-4 py-3">{t("columns.reporter")}</th>
                  <th className="text-start px-4 py-3">{t("columns.reason")}</th>
                  <th className="text-start px-4 py-3">{t("columns.description")}</th>
                  <th className="text-start px-4 py-3">{t("columns.status")}</th>
                  <th className="text-start px-4 py-3">{t("columns.date")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <ReportRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

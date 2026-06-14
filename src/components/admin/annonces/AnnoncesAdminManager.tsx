"use client"

import { useMemo, useState } from "react"
import { Search, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

import { AdminAnnonceRow } from "@/components/admin/annonces/AdminAnnonceRow"
import { EmptyState } from "@/components/ui/EmptyState"
import type { AdminAnnonceRow as Row } from "@/lib/queries/admin"
import type { AnnonceStatus } from "@/types/database.types"
import { cn } from "@/lib/utils"

type Props = {
  annonces: Row[]
}

type StatusFilter = "all" | AnnonceStatus

const STATUS_TABS: StatusFilter[] = [
  "all",
  "active",
  "pending",
  "rejected",
  "sold",
  "expired",
  "draft",
]

export function AnnoncesAdminManager({ annonces }: Props) {
  const t = useTranslations("adminPanel.allAnnoncesPage")
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [featuredOnly, setFeaturedOnly] = useState(false)

  const counts = useMemo(() => {
    const map = new Map<StatusFilter, number>()
    map.set("all", annonces.length)
    for (const a of annonces) {
      map.set(a.status, (map.get(a.status) ?? 0) + 1)
    }
    return map
  }, [annonces])

  const filtered = useMemo(() => {
    let rows = annonces
    if (status !== "all") rows = rows.filter((a) => a.status === status)
    if (featuredOnly) rows = rows.filter((a) => a.featured)
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      rows = rows.filter(
        (a) =>
          a.title.toLowerCase().includes(needle) ||
          (a.brand?.name ?? "").toLowerCase().includes(needle) ||
          (a.model?.name ?? "").toLowerCase().includes(needle) ||
          (a.user?.full_name ?? "").toLowerCase().includes(needle),
      )
    }
    return rows
  }, [annonces, status, featuredOnly, q])

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

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search
            className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="w-full h-11 ps-10 pe-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"
          />
        </div>

        <label className="inline-flex items-center gap-2 h-11 px-3 rounded-xl border border-border bg-card text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(e) => setFeaturedOnly(e.target.checked)}
            className="size-4 accent-moroccan-gold-500"
          />
          <Sparkles className="size-4 text-moroccan-gold-500" aria-hidden="true" />
          {t("featuredOnly")}
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("count", { count: filtered.length })}
      </p>

      {/* Table */}
      {annonces.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState icon={Search} title={t("empty")} />
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
                  <th className="text-start px-4 py-3 min-w-[260px]">
                    {t("columns.annonce")}
                  </th>
                  <th className="text-start px-4 py-3">{t("columns.seller")}</th>
                  <th className="text-start px-4 py-3">{t("columns.price")}</th>
                  <th className="text-start px-4 py-3">{t("columns.status")}</th>
                  <th className="text-start px-4 py-3">{t("columns.views")}</th>
                  <th className="text-start px-4 py-3">{t("columns.date")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <AdminAnnonceRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

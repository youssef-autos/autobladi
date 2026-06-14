"use client"

import { useMemo, useState, useTransition } from "react"
import { Megaphone, Pencil, Plus, Power, Search, Trash2 } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  deleteAd,
  toggleAdActive,
} from "@/app/[locale]/admin/ads/actions"
import { AdFormDialog } from "@/components/admin/ads/AdFormDialog"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/EmptyState"
import type { AdminAdRow, AdminPlacementRow } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"

type Props = {
  ads: AdminAdRow[]
  placements: AdminPlacementRow[]
}

type StatusKey = "all" | "active" | "inactive"

function getAdStatus(ad: AdminAdRow): "active" | "scheduled" | "expired" | "inactive" {
  if (!ad.is_active) return "inactive"
  const now = new Date()
  if (ad.starts_at && new Date(ad.starts_at) > now) return "scheduled"
  if (ad.ends_at && new Date(ad.ends_at) < now) return "expired"
  return "active"
}

export function AdsManager({ ads, placements }: Props) {
  const t = useTranslations("adminPanel.adsPage")
  const fmt = useFormatter()
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusKey>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<AdminAdRow | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    let rows = ads
    if (statusFilter === "active") rows = rows.filter((a) => a.is_active)
    if (statusFilter === "inactive") rows = rows.filter((a) => !a.is_active)
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      rows = rows.filter(
        (a) =>
          a.title.toLowerCase().includes(needle) ||
          (a.placement?.name.toLowerCase().includes(needle) ?? false),
      )
    }
    return rows
  }, [ads, statusFilter, q])

  function onToggle(ad: AdminAdRow) {
    setPendingId(ad.id)
    startTransition(async () => {
      const res = await toggleAdActive({ id: ad.id, is_active: !ad.is_active })
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.toggled"))
    })
  }

  function onDelete(ad: AdminAdRow) {
    if (!window.confirm(t("deleteConfirm", { title: ad.title }))) return
    setPendingId(ad.id)
    startTransition(async () => {
      const res = await deleteAd(ad.id)
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.deleted"))
    })
  }

  const activeCount = ads.filter((a) => a.is_active).length

  return (
    <div className="space-y-6">
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
        <div className="flex items-center gap-2">
          {(["all", "active", "inactive"] as StatusKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                "h-9 px-3 rounded-full text-xs font-medium border transition-colors",
                statusFilter === key
                  ? "bg-moroccan-red-500 text-white border-transparent"
                  : "bg-card border-border text-foreground hover:bg-moroccan-sand-50",
              )}
            >
              {t(key === "all" ? "filterAll" : key === "active" ? "filterActive" : "filterInactive")}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setCreateOpen(true)
            }}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("addAd")}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("count", { count: ads.length })}
        {" · "}
        <span className="text-moroccan-mint-500">{activeCount} {t("status.active")}</span>
      </p>

      {/* Table */}
      {ads.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={Megaphone}
            title={t("empty")}
            description={t("emptyDesc")}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-8 shadow-card text-center text-sm text-muted-foreground">
          —
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3 w-20">{t("columns.image")}</th>
                  <th className="text-start px-4 py-3">{t("columns.title")}</th>
                  <th className="text-start px-4 py-3">{t("columns.placement")}</th>
                  <th className="text-start px-4 py-3">{t("columns.dates")}</th>
                  <th className="text-start px-4 py-3">{t("columns.status")}</th>
                  <th className="text-start px-4 py-3">{t("columns.stats")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ad) => {
                  const status = getAdStatus(ad)
                  const ctr =
                    ad.impressions > 0
                      ? ((ad.clicks / ad.impressions) * 100).toFixed(1)
                      : "0.0"
                  return (
                    <tr
                      key={ad.id}
                      className={cn(
                        "border-t border-border hover:bg-moroccan-sand-50/40",
                        !ad.is_active && "opacity-60",
                      )}
                    >
                      <td className="px-4 py-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="h-12 w-16 object-cover rounded-lg border border-border bg-moroccan-sand-50"
                          loading="lazy"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground line-clamp-1 max-w-[180px]">
                          {ad.title}
                        </p>
                        {ad.link_url && (
                          <a
                            href={ad.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-moroccan-red-500 hover:underline truncate block max-w-[180px]"
                          >
                            {ad.link_url.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-foreground">
                          {ad.placement?.name ?? "—"}
                        </p>
                        {ad.placement?.width && ad.placement?.height && (
                          <p className="text-[11px] text-muted-foreground">
                            {ad.placement.width}×{ad.placement.height}px
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {ad.starts_at ? (
                          <span className="block">
                            {fmt.dateTime(new Date(ad.starts_at), { dateStyle: "short" })}
                          </span>
                        ) : null}
                        {ad.ends_at ? (
                          <span className="block">
                            → {fmt.dateTime(new Date(ad.ends_at), { dateStyle: "short" })}
                          </span>
                        ) : null}
                        {!ad.starts_at && !ad.ends_at && <span>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground space-y-0.5">
                        <p>{t("stats.clicks", { count: ad.clicks })}</p>
                        <p>{t("stats.impressions", { count: ad.impressions })}</p>
                        <p className="text-moroccan-gold-700">
                          {t("stats.ctr", { rate: ctr })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onToggle(ad)}
                            disabled={pendingId === ad.id}
                            className={cn(
                              "inline-flex items-center justify-center size-9 rounded-lg hover:bg-moroccan-sand-50 disabled:opacity-50",
                              ad.is_active
                                ? "text-moroccan-mint-500"
                                : "text-muted-foreground",
                            )}
                            title={ad.is_active ? "Désactiver" : "Activer"}
                          >
                            <Power className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(ad)
                              setCreateOpen(true)
                            }}
                            className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700"
                            aria-label="Edit"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(ad)}
                            disabled={pendingId === ad.id}
                            className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-red-50 hover:text-moroccan-red-600 disabled:opacity-50"
                            aria-label="Delete"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        placements={placements}
        initial={editing}
      />
    </div>
  )
}

/**
 * Calls useTranslations() directly instead of receiving `t` as a prop.
 * In Next.js App Router even within "use client" trees, sub-components that
 * accept function props can trigger the strict prop-serialization check —
 * the safest pattern is to fetch translations at the call site.
 */
function StatusBadge({
  status,
}: {
  status: "active" | "scheduled" | "expired" | "inactive"
}) {
  const t = useTranslations("adminPanel.adsPage")
  const variantMap = {
    active: "verified",
    scheduled: "featured",
    expired: "outline",
    inactive: "outline",
  } as const
  return (
    <Badge variant={variantMap[status]} className="text-[10px]">
      {t(`status.${status}`)}
    </Badge>
  )
}

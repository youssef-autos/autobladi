"use client"

import { useMemo, useState, useTransition } from "react"
import {
  Building2,
  Car,
  ExternalLink,
  MapPin,
  Power,
  Search,
  Star,
  Trash2,
} from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  deleteProfessionnel,
  toggleProfessionnelActive,
} from "@/app/[locale]/admin/showrooms/actions"
import { Link } from "@/i18n/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/EmptyState"
import type { AdminProfessionnelRow } from "@/lib/queries/admin"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  professionnels: AdminProfessionnelRow[]
}

function initials(name?: string | null): string {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function ProfessionnelsManager({ professionnels }: Props) {
  const t = useTranslations("adminPanel.professionnelsPage")
  const locale = useLocale() as Locale
  const format = useFormatter()
  const [q, setQ] = useState("")
  const [showInactive, setShowInactive] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    let rows = professionnels
    if (!showInactive) rows = rows.filter((c) => c.is_active)
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.slug.toLowerCase().includes(needle) ||
          (c.owner?.full_name ?? "").toLowerCase().includes(needle),
      )
    }
    return rows
  }, [professionnels, q, showInactive])

  function onToggle(row: AdminProfessionnelRow) {
    setPendingId(row.id)
    startTransition(async () => {
      const res = await toggleProfessionnelActive({
        id: row.id,
        is_active: !row.is_active,
      })
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(row.is_active ? t("toast.deactivated") : t("toast.activated"))
    })
  }

  function onDelete(row: AdminProfessionnelRow) {
    if (!window.confirm(t("deleteConfirm", { name: row.name }))) return
    setPendingId(row.id)
    startTransition(async () => {
      const res = await deleteProfessionnel(row.id)
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.deleted"))
    })
  }

  const activeCount = professionnels.filter((c) => c.is_active).length

  return (
    <div className="space-y-5">
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
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="size-4 accent-moroccan-red-500"
          />
          {t("showInactive")}
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("count", { count: professionnels.length })}
        {" · "}
        <span className="text-moroccan-mint-500">
          {activeCount} {t("active")}
        </span>
      </p>

      {/* Table */}
      {professionnels.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={Building2}
            title={t("empty")}
            description={t("emptyDesc")}
          />
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
                    {t("columns.name")}
                  </th>
                  <th className="text-start px-4 py-3">{t("columns.city")}</th>
                  <th className="text-start px-4 py-3">{t("columns.owner")}</th>
                  <th className="text-start px-4 py-3">{t("columns.rating")}</th>
                  <th className="text-start px-4 py-3">{t("columns.annonces")}</th>
                  <th className="text-start px-4 py-3">{t("columns.status")}</th>
                  <th className="text-start px-4 py-3">{t("columns.created")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const cityName = row.city
                    ? locale === "ar"
                      ? row.city.name_ar
                      : row.city.name_fr
                    : null
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-t border-border hover:bg-moroccan-sand-50/40",
                        !row.is_active && "opacity-60",
                      )}
                    >
                      {/* Name + logo */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative size-11 rounded-lg bg-moroccan-sand-50 overflow-hidden shrink-0 border border-border flex items-center justify-center">
                            {row.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.logo_url}
                                alt={row.name}
                                className="h-full w-full object-contain p-1"
                                loading="eager"
                              />
                            ) : (
                              <Building2 className="size-5 text-moroccan-sand-200" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {row.name}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground truncate">
                              {row.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* City */}
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {cityName ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3.5" aria-hidden="true" />
                            {cityName}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-7 shrink-0">
                            {row.owner?.avatar_url && (
                              <AvatarImage
                                src={row.owner.avatar_url}
                                alt={row.owner.full_name ?? ""}
                              />
                            )}
                            <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-[10px] font-semibold">
                              {initials(row.owner?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground truncate">
                            {row.owner?.full_name ?? "—"}
                          </span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-sm text-foreground tabular-nums">
                          <Star
                            className="size-3.5 text-moroccan-gold-500 fill-current"
                            aria-hidden="true"
                          />
                          {row.rating.toFixed(1)}
                          <span className="text-xs text-muted-foreground">
                            ({row.reviews_count})
                          </span>
                        </span>
                      </td>

                      {/* Annonces count */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                          <Car className="size-3.5" aria-hidden="true" />
                          {row.annonces_count}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {row.is_active ? (
                          <Badge variant="verified" className="text-[10px]">
                            {t("active")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {t("inactive")}
                          </Badge>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format.dateTime(new Date(row.created_at), {
                          dateStyle: "medium",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/showroom/${row.slug}`}
                            target="_blank"
                            className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground"
                            aria-label={t("preview")}
                            title={t("preview")}
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => onToggle(row)}
                            disabled={pendingId === row.id}
                            className={cn(
                              "inline-flex items-center justify-center size-9 rounded-lg hover:bg-moroccan-sand-50 disabled:opacity-50",
                              row.is_active
                                ? "text-moroccan-mint-500"
                                : "text-muted-foreground",
                            )}
                            aria-label={
                              row.is_active ? t("deactivate") : t("activate")
                            }
                            title={row.is_active ? t("deactivate") : t("activate")}
                          >
                            <Power className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            disabled={pendingId === row.id}
                            className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-red-50 hover:text-moroccan-red-600 disabled:opacity-50"
                            aria-label={t("delete")}
                            title={t("delete")}
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
    </div>
  )
}

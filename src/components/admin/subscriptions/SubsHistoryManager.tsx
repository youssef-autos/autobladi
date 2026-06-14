"use client"

import { useMemo, useState } from "react"
import { Banknote } from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatPrice } from "@/lib/utils/format"
import type { AdminSubscriptionRow } from "@/lib/queries/admin"
import type { RequestStatus } from "@/types/database.types"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  subscriptions: AdminSubscriptionRow[]
}

type StatusFilter = "all" | RequestStatus

const STATUS_TABS: StatusFilter[] = ["all", "pending", "approved", "rejected"]

const statusVariant: Record<RequestStatus, "featured" | "verified" | "outline"> = {
  pending: "featured",
  approved: "verified",
  rejected: "outline",
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

export function SubsHistoryManager({ subscriptions }: Props) {
  const t = useTranslations("adminPanel.subsHistoryPage")
  const locale = useLocale() as Locale
  const format = useFormatter()
  const [status, setStatus] = useState<StatusFilter>("all")

  const counts = useMemo(() => {
    const map = new Map<StatusFilter, number>()
    map.set("all", subscriptions.length)
    for (const s of subscriptions) {
      map.set(s.status, (map.get(s.status) ?? 0) + 1)
    }
    return map
  }, [subscriptions])

  const filtered = useMemo(() => {
    if (status === "all") return subscriptions
    return subscriptions.filter((s) => s.status === status)
  }, [subscriptions, status])

  function shortDate(value: string | null) {
    if (!value) return "—"
    return format.dateTime(new Date(value), { dateStyle: "medium" })
  }

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

      {subscriptions.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={Banknote}
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
                  <th className="text-start px-4 py-3">{t("columns.user")}</th>
                  <th className="text-start px-4 py-3">{t("columns.plan")}</th>
                  <th className="text-start px-4 py-3">{t("columns.amount")}</th>
                  <th className="text-start px-4 py-3">{t("columns.status")}</th>
                  <th className="text-start px-4 py-3">{t("columns.period")}</th>
                  <th className="text-start px-4 py-3">{t("columns.date")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const planName =
                    locale === "ar" && row.plan?.name_ar
                      ? row.plan.name_ar
                      : row.plan?.name ?? "—"
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-border hover:bg-moroccan-sand-50/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-8 shrink-0">
                            {row.user?.avatar_url && (
                              <AvatarImage
                                src={row.user.avatar_url}
                                alt={row.user.full_name ?? ""}
                              />
                            )}
                            <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-xs font-semibold">
                              {initials(row.user?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground truncate">
                            {row.user?.full_name ?? "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-foreground">
                        {planName}
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold tabular-nums">
                        {formatPrice(row.amount, locale)}
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          variant={statusVariant[row.status]}
                          className="text-[10px]"
                        >
                          {t(`statusLabels.${row.status}`)}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {row.starts_at || row.ends_at
                          ? `${shortDate(row.starts_at)} → ${shortDate(row.ends_at)}`
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {shortDate(row.created_at)}
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

"use client"

import { useState, useTransition } from "react"
import { Building2, Check, Store } from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { toggleShowroomActive } from "@/app/[locale]/admin/showrooms/actions"
import { Card } from "@/components/ui/Card"
import { Link, useRouter } from "@/i18n/navigation"
import type { PendingShowroomRow } from "@/lib/queries/admin"
import type { Locale } from "@/i18n/routing"

type Props = {
  rows: PendingShowroomRow[]
  total: number
}

export function PendingShowroomsWidget({ rows, total }: Props) {
  const t = useTranslations("adminPanel.dashboard.pendingShowrooms")
  const locale = useLocale() as Locale
  const format = useFormatter()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  function approve(row: PendingShowroomRow) {
    setPendingId(row.id)
    startTransition(async () => {
      const res = await toggleShowroomActive({ id: row.id, is_active: true })
      if (!res.ok) {
        toast.error(t("toast.error"))
        setPendingId(null)
        return
      }
      toast.success(t("toast.approved", { name: row.name }))
      router.refresh()
    })
  }

  return (
    <Card as="section" padding="none" className="p-6">
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Store className="size-5 text-moroccan-red-500" aria-hidden="true" />
          <h2 className="font-semibold text-foreground">{t("title")}</h2>
        </div>
        {total > 0 && (
          <Link
            href="/admin/showrooms"
            className="text-xs font-medium text-moroccan-red-500 hover:underline shrink-0"
          >
            {t("viewAll", { count: total })} →
          </Link>
        )}
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const cityName = row.city
              ? locale === "ar"
                ? row.city.name_ar
                : row.city.name_fr
              : null
            const rowPending = pending && pendingId === row.id
            return (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"
              >
                <Link
                  href="/admin/showrooms"
                  className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                >
                  <span className="relative size-10 shrink-0 rounded-lg bg-moroccan-sand-50 border border-border overflow-hidden flex items-center justify-center">
                    {row.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.logo_url}
                        alt=""
                        className="size-full object-contain p-1"
                      />
                    ) : (
                      <Building2 className="size-4 text-moroccan-sand-200" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground truncate">
                      {row.name}
                    </span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {[row.owner?.full_name, cityName].filter(Boolean).join(" · ") ||
                        format.dateTime(new Date(row.created_at), { dateStyle: "medium" })}
                    </span>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => approve(row)}
                  disabled={rowPending}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-moroccan-mint-500/10 text-moroccan-mint-600 text-xs font-semibold hover:bg-moroccan-mint-500/20 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  {rowPending ? t("approving") : t("approve")}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

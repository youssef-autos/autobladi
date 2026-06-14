"use client"

import { useMemo, useState } from "react"
import { Copy, Search, Users } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"

import { EmptyState } from "@/components/ui/EmptyState"

export type SubscriberView = {
  id: string
  email: string
  name: string
  created_at: string
}

type Props = {
  subscribers: SubscriberView[]
}

export function SubscribersPanel({ subscribers }: Props) {
  const t = useTranslations("adminPanel.newsletterPage")
  const format = useFormatter()
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    if (!q.trim()) return subscribers
    const needle = q.trim().toLowerCase()
    return subscribers.filter(
      (s) =>
        s.email.toLowerCase().includes(needle) ||
        s.name.toLowerCase().includes(needle),
    )
  }, [subscribers, q])

  function copyEmails() {
    const emails = subscribers.map((s) => s.email).join(", ")
    if (!emails) return
    navigator.clipboard
      .writeText(emails)
      .then(() => toast.success(t("toast.copied", { count: subscribers.length })))
      .catch(() => toast.error(t("toast.copyError")))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-foreground">
          {t("subscribers")}
        </h2>
        <button
          type="button"
          onClick={copyEmails}
          disabled={subscribers.length === 0}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-moroccan-sand-50 disabled:opacity-50"
        >
          <Copy className="size-4" aria-hidden="true" />
          {t("copyEmails")}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search
          className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchSubscribers")}
          className="w-full h-11 ps-10 pe-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"
        />
      </div>

      {subscribers.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState icon={Users} title={t("noSubscribers")} />
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
                  <th className="text-start px-4 py-3">{t("columns.name")}</th>
                  <th className="text-start px-4 py-3">{t("columns.email")}</th>
                  <th className="text-start px-4 py-3">{t("columns.joined")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-border hover:bg-moroccan-sand-50/40"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {s.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {s.email}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format.dateTime(new Date(s.created_at), {
                        dateStyle: "medium",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

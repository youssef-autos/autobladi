"use client"

import { Calendar, Clock, RefreshCcw, Tag } from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils/format"
import type {
  SubscriptionRequestRow,
} from "@/lib/queries/subscriptions"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

const EXPIRING_SOON_DAYS = 7

type Props = {
  current: SubscriptionRequestRow | null
  history: SubscriptionRequestRow[]
}

export function SubscriptionStatus({ current, history }: Props) {
  const t = useTranslations("subscription.status")
  const tStatus = useTranslations("subscription.requestStatus")
  const locale = useLocale() as Locale
  const format = useFormatter()

  const now = new Date()
  const daysLeft = current?.ends_at
    ? Math.ceil(
        (new Date(current.ends_at).getTime() - now.getTime()) / 86_400_000,
      )
    : null
  const expiringSoon =
    daysLeft != null && daysLeft >= 0 && daysLeft <= EXPIRING_SOON_DAYS

  return (
    <div className="space-y-6">
      {/* Current subscription card */}
      {current ? (
        <section
          className={cn(
            "rounded-2xl border p-6 shadow-card",
            expiringSoon
              ? "border-moroccan-gold-500/40 bg-moroccan-gold-50/40"
              : "border-moroccan-mint-500/30 bg-moroccan-mint-500/5",
          )}
        >
          <header className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("currentTitle")}
              </p>
              <h2 className="font-display text-2xl font-bold text-foreground mt-1">
                {locale === "ar" && current.plan?.name_ar
                  ? current.plan.name_ar
                  : (current.plan?.name ?? "—")}
              </h2>
            </div>
            <Badge variant={expiringSoon ? "featured" : "verified"}>
              {expiringSoon ? t("expiringSoon") : tStatus("approved")}
            </Badge>
          </header>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Stat
              icon={Calendar}
              label={t("startedAt")}
              value={
                current.starts_at
                  ? format.dateTime(new Date(current.starts_at), {
                      dateStyle: "medium",
                    })
                  : "—"
              }
            />
            <Stat
              icon={Clock}
              label={t("expiresAt")}
              value={
                current.ends_at
                  ? format.dateTime(new Date(current.ends_at), {
                      dateStyle: "medium",
                    })
                  : "—"
              }
            />
            <Stat
              icon={Tag}
              label={t("amount")}
              value={formatPrice(current.amount, locale)}
            />
            {daysLeft != null && (
              <Stat
                icon={RefreshCcw}
                label="—"
                value={
                  daysLeft >= 0
                    ? t("daysLeft", { days: daysLeft })
                    : t("expiredOn", {
                        date: format.dateTime(new Date(current.ends_at ?? now), {
                          dateStyle: "medium",
                        }),
                      })
                }
              />
            )}
          </dl>

          <div className="mt-5">
            <Link
              href="/dashboard/upgrade"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
            >
              <RefreshCcw className="size-4" aria-hidden="true" />
              {t("renew")}
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card text-center space-y-3">
          <h2 className="font-display text-xl font-bold text-foreground">
            {t("noActiveTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("noActiveDesc")}</p>
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center h-10 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
          >
            {t("renew")}
          </Link>
        </section>
      )}

      {/* History */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-semibold text-foreground mb-4">{t("historyTitle")}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t("historyEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-start py-2 pe-3 font-medium">
                    {t("tablePlan")}
                  </th>
                  <th className="text-start py-2 pe-3 font-medium">
                    {t("tableSubmitted")}
                  </th>
                  <th className="text-start py-2 pe-3 font-medium">
                    {t("tableAmount")}
                  </th>
                  <th className="text-start py-2 font-medium">
                    {t("tableStatus")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((req) => (
                  <tr key={req.id}>
                    <td className="py-3 pe-3 font-medium text-foreground">
                      {locale === "ar" && req.plan?.name_ar
                        ? req.plan.name_ar
                        : (req.plan?.name ?? "—")}
                    </td>
                    <td className="py-3 pe-3 text-muted-foreground whitespace-nowrap">
                      {format.dateTime(new Date(req.created_at), {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="py-3 pe-3 tabular-nums">
                      {formatPrice(req.amount, locale)}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          req.status === "approved"
                            ? "verified"
                            : req.status === "pending"
                              ? "featured"
                              : "destructive"
                        }
                      >
                        {tStatus(req.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value: string
}) {
  return (
    <div>
      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </p>
      <p className="text-sm font-medium text-foreground mt-1 tabular-nums">{value}</p>
    </div>
  )
}
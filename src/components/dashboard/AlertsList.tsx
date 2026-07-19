import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import type { ExpiringAnnonceRow } from "@/lib/queries/dashboard"

type Props = {
  expiring: ExpiringAnnonceRow[]
}

export async function AlertsList({ expiring }: Props) {
  const t = await getTranslations("dashboard.home.alerts")

  const hasAlerts = expiring.length > 0

  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-soft">
      <header className="mb-4">
        <h2 className="font-semibold text-foreground">{t("title")}</h2>
      </header>

      {!hasAlerts ? (
        <p className="inline-flex items-center gap-2 text-sm text-moroccan-mint-500">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {t("noAlerts")}
        </p>
      ) : (
        <ul className="space-y-3">
          {expiring.length > 0 && (
            <li className="flex items-start gap-3 rounded-xl bg-moroccan-gold-50/60 border border-moroccan-gold-500/30 p-3">
              <AlertTriangle
                className="size-5 text-moroccan-gold-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t("expiring", { count: expiring.length })}
                </p>
                <Link
                  href="/dashboard/annonces"
                  className="inline-block mt-1 text-xs font-medium text-moroccan-gold-700 hover:underline"
                >
                  {t("renew")} →
                </Link>
              </div>
            </li>
          )}
        </ul>
      )}
    </section>
  )
}

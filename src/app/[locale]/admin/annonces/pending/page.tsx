import { Clock } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AnnonceModerationRow } from "@/components/admin/AnnonceModerationRow"
import { EmptyState } from "@/components/ui/EmptyState"
import { listPendingAnnonces } from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

export default async function PendingAnnoncesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.annoncesQueue")
  const rows = await listPendingAnnonces()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState icon={Clock} title={t("empty")} />
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
                  <th className="text-start px-4 py-3">{t("columns.submitted")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <AnnonceModerationRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

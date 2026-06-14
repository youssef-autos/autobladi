import { Sparkles } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AdminAnnonceRow } from "@/components/admin/annonces/AdminAnnonceRow"
import { EmptyState } from "@/components/ui/EmptyState"
import { listFeaturedAnnoncesAdmin } from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

export default async function FeaturedAnnoncesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.featuredPage")
  const tCols = await getTranslations("adminPanel.allAnnoncesPage.columns")
  const rows = await listFeaturedAnnoncesAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-moroccan-gold-500/30 bg-moroccan-gold-50/60 p-4">
        <Sparkles
          className="size-5 shrink-0 text-moroccan-gold-700 mt-0.5"
          aria-hidden="true"
        />
        <p className="text-sm text-moroccan-gold-700">{t("hint")}</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={Sparkles}
            title={t("empty")}
            description={t("emptyDesc")}
          />
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {t("count", { count: rows.length })}
          </p>
          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-start px-4 py-3 min-w-[260px]">
                      {tCols("annonce")}
                    </th>
                    <th className="text-start px-4 py-3">{tCols("seller")}</th>
                    <th className="text-start px-4 py-3">{tCols("price")}</th>
                    <th className="text-start px-4 py-3">{tCols("status")}</th>
                    <th className="text-start px-4 py-3">{tCols("views")}</th>
                    <th className="text-start px-4 py-3">{tCols("date")}</th>
                    <th className="text-end px-4 py-3">{tCols("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <AdminAnnonceRow key={row.id} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

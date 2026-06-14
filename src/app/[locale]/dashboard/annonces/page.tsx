import { Plus, Tag } from "lucide-react"
import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AnnonceRow } from "@/components/dashboard/AnnonceRow"
import { EmptyState } from "@/components/ui/EmptyState"
import { Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { listMyAnnonces } from "@/lib/queries/dashboard"

export const dynamic = "force-dynamic"

export default async function MyAnnoncesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("dashboard.annoncesPage")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion`)

  const rows = await listMyAnnonces(user.id)

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href="/dashboard/ajouter"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("addNew")}
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-soft">
          <EmptyState
            icon={Tag}
            title={t("empty")}
            description={t("emptyDesc")}
            action={
              <Link
                href="/dashboard/ajouter"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
              >
                <Plus className="size-4" />
                {t("addNew")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3 min-w-[260px]">
                    {t("columns.annonce")}
                  </th>
                  <th className="text-start px-4 py-3">{t("columns.price")}</th>
                  <th className="text-start px-4 py-3">{t("columns.status")}</th>
                  <th className="text-start px-4 py-3">{t("columns.views")}</th>
                  <th className="text-start px-4 py-3">{t("columns.published")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <AnnonceRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

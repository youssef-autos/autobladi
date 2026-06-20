import { setRequestLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { BarChart3 } from "lucide-react"

import { AdsManager } from "@/components/admin/ads/AdsManager"
import { AdsStatsOverview } from "@/components/admin/ads/AdsStatsOverview"
import {
  listAllAdsAdmin,
  listAllPlacementsAdmin,
} from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminAdsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.adsPage")
  const [ads, placements] = await Promise.all([
    listAllAdsAdmin(),
    listAllPlacementsAdmin(),
  ])

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href="/admin/ads/report"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium shadow-card hover:bg-moroccan-sand-50 transition-colors"
        >
          <BarChart3 className="size-4 text-moroccan-red-600" />
          {locale === "ar" ? "تقرير المعلنين" : "Rapport annonceurs"}
        </Link>
      </header>

      <AdsStatsOverview ads={ads} />

      <AdsManager ads={ads} placements={placements} />
    </div>
  )
}

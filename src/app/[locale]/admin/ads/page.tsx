import { setRequestLocale, getTranslations } from "next-intl/server"

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
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      <AdsStatsOverview ads={ads} />

      <AdsManager ads={ads} placements={placements} />
    </div>
  )
}

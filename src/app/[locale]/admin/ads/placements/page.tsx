import { setRequestLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, Megaphone } from "lucide-react"

import { AdSettingsManager } from "@/components/admin/ads/AdSettingsManager"
import { listAdSlotSettings } from "@/lib/queries/admin"
import { getAdsenseClientId } from "@/lib/queries/home"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminPlacementsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.placementsPage")
  const [slots, adsenseClientId] = await Promise.all([
    listAdSlotSettings(),
    getAdsenseClientId(),
  ])

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/ads"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-moroccan-red-500"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
            {locale === "ar" ? "الإعلانات التجارية" : "Publicités"}
          </Link>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <p className="text-xs text-muted-foreground">
          {t("count", { count: slots.length })}
        </p>
      </header>

      {/* Helper: where direct campaigns are managed */}
      <div className="flex items-start gap-2 rounded-xl border border-border bg-moroccan-sand-50/40 p-3 text-xs text-muted-foreground">
        <Megaphone className="size-4 mt-0.5 text-moroccan-gold-600 shrink-0" />
        <p>
          {t("campaignsHint")}{" "}
          <Link href="/admin/ads" className="font-medium text-moroccan-red-500 hover:underline">
            /admin/ads
          </Link>
        </p>
      </div>

      <AdSettingsManager slots={slots} adsenseClientId={adsenseClientId} />
    </div>
  )
}

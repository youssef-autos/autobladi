import { setRequestLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, BarChart3 } from "lucide-react"

import { AdsReportView } from "@/components/admin/ads/AdsReportView"
import { getAdsReport } from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdsReportPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.adsReport")

  const [report] = await Promise.all([getAdsReport()])

  const generatedAt = new Date().toLocaleDateString(
    locale === "ar" ? "ar-MA" : "fr-MA",
    { day: "numeric", month: "long", year: "numeric" },
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Print header — only shown when printing */}
      <div className="hidden print:block mb-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <BarChart3 className="size-7 text-moroccan-red-600" />
          <div>
            <p className="text-lg font-bold text-foreground">autobladi.ma</p>
            <p className="text-xs text-muted-foreground">{t("title")}</p>
          </div>
        </div>
      </div>

      <header className="space-y-1 print:hidden">
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
      </header>

      <AdsReportView report={report} generatedAt={generatedAt} />
    </div>
  )
}

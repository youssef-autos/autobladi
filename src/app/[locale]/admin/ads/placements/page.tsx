import { setRequestLocale, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowLeft } from "lucide-react"

import { PlacementsManager } from "@/components/admin/ads/PlacementsManager"
import { listAllPlacementsAdmin } from "@/lib/queries/admin"

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
  const placements = await listAllPlacementsAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header className="space-y-1">
        <Link
          href="/admin/ads"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-moroccan-red-500"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
          {locale === "ar" ? "الإعلانات التجارية" : "Publicités"}
        </Link>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <p className="text-xs text-muted-foreground">
          {t("count", { count: placements.length })}
        </p>
      </header>

      <PlacementsManager placements={placements} />
    </div>
  )
}

import { Info } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { SectionsManager } from "@/components/admin/sections/SectionsManager"
import { getHomeSectionsConfig } from "@/lib/queries/home"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminSectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.sectionsPage")
  const sections = await getHomeSectionsConfig()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      <div className="flex max-w-2xl items-start gap-3 rounded-2xl border border-moroccan-gold-500/30 bg-moroccan-gold-50/50 p-4">
        <Info
          className="size-5 shrink-0 text-moroccan-gold-700 mt-0.5"
          aria-hidden="true"
        />
        <p className="text-sm text-moroccan-gold-700">{t("hint")}</p>
      </div>

      <SectionsManager initial={sections} />
    </div>
  )
}

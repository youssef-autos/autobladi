import { getTranslations, setRequestLocale } from "next-intl/server"

import { PlansManager } from "@/components/admin/subscriptions/PlansManager"
import { listAllPlansAdmin } from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

export default async function AdminPlansPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.plansPage")
  const plans = await listAllPlansAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      <PlansManager plans={plans} />
    </div>
  )
}

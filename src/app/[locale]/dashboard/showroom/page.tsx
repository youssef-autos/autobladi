import { ExternalLink, Rocket } from "lucide-react"
import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ShowroomInfoForm } from "@/components/dashboard/showroom/InfoForm"
import { EmptyState } from "@/components/ui/EmptyState"
import { Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyProfessionnel } from "@/lib/queries/professionnels"
import { getCities, getSecteurs } from "@/lib/queries/home"

export const dynamic = "force-dynamic"

export default async function ShowroomDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("showroom")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion?returnTo=/${locale}/dashboard/showroom`)

  const [dealer, cities, secteurs] = await Promise.all([
    getMyProfessionnel(),
    getCities(),
    getSecteurs(),
  ])

  if (!dealer) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="rounded-2xl bg-card border border-border p-12 shadow-soft">
          <EmptyState
            icon={Rocket}
            title={t("notReady.title")}
            description={t("notReady.desc")}
            action={
              <Link
                href="/dashboard/upgrade"
                className="inline-flex items-center h-11 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
              >
                {t("notReady.upgradeCta")} →
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href={`/professionnel/${dealer.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-moroccan-red-500 hover:underline"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          {t("publicLink")}
        </Link>
      </header>

      <ShowroomInfoForm dealer={dealer} cities={cities} secteurs={secteurs} />
    </div>
  )
}

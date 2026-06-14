import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { CompteForm } from "@/components/dashboard/CompteForm"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/queries/dashboard"

export const dynamic = "force-dynamic"

export default async function ComptePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("dashboard.comptePage")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion`)

  const profile = await getCurrentProfile()
  if (!profile) redirect(`/${locale}/auth/connexion`)

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      <CompteForm initial={profile} email={user.email ?? ""} />
    </div>
  )
}

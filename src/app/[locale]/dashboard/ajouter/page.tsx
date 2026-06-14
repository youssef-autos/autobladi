import { getTranslations, setRequestLocale } from "next-intl/server"

import { AjouterWizard } from "@/components/forms/AjouterAnnonce/AjouterWizard"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { createClient } from "@/lib/supabase/server"
import {
  getActiveBrands,
  getActiveModels,
  getCities,
  getSecteurs,
} from "@/lib/queries/home"

export const dynamic = "force-dynamic"

export default async function AjouterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("ajouter")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let defaultPhone = ""
  let defaultWhatsapp = ""
  let isPro = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, whatsapp, account_type")
      .eq("id", user.id)
      .maybeSingle<{
        phone: string | null
        whatsapp: string | null
        account_type: string | null
      }>()
    defaultPhone = profile?.phone ?? ""
    defaultWhatsapp = profile?.whatsapp ?? ""
    isPro = profile?.account_type === "pro" || profile?.account_type === "admin"
  }

  const [brands, models, cities, secteurs] = await Promise.all([
    getActiveBrands(),
    getActiveModels(),
    getCities(),
    getSecteurs(),
  ])

  return (
    <section className="py-8 md:py-12">
      <Container>
        <header className="space-y-3 mb-8 max-w-2xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            {t("pageTitle")}
          </h1>
          <GoldAccent />
          <p className="text-muted-foreground">{t("pageSubtitle")}</p>
        </header>

        <AjouterWizard
          brands={brands}
          models={models}
          cities={cities}
          secteurs={secteurs}
          defaultPhone={defaultPhone}
          defaultWhatsapp={defaultWhatsapp}
          isPro={isPro}
        />
      </Container>
    </section>
  )
}

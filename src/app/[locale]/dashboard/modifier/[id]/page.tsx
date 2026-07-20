import { notFound, redirect } from "next/navigation"
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
import type { AnnonceFormValues } from "@/lib/validations/annonce"
import type { Tables } from "@/types/database.types"

export const dynamic = "force-dynamic"

type EditRow = Tables<"annonces"> & {
  annonce_images:
    | { url: string; thumbnail_url: string | null; is_main: boolean; order_index: number }[]
    | null
}

export default async function ModifierAnnoncePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("dashboard.modifier")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion`)

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string | null }>()
  const isAdmin = profile?.account_type === "admin"
  const isPro = isAdmin || profile?.account_type === "pro"

  let query = supabase
    .from("annonces")
    .select(
      `id, condition, brand_id, model_id, city_id, secteur_id, year,
       mileage, fuel_type, transmission, doors, seats, color, origine,
       engine_power, engine_size, first_owner, accident_free, options, title,
       description, price, price_on_request, contact_phone, contact_whatsapp, video_url,
       annonce_images(url, thumbnail_url, is_main, order_index)`,
    )
    .eq("id", id)
  if (!isAdmin) query = query.eq("user_id", user.id)
  const { data } = await query.maybeSingle()

  if (!data) notFound()
  const a = data as unknown as EditRow

  const [brands, models, cities, secteurs] = await Promise.all([
    getActiveBrands(),
    getActiveModels(),
    getCities(),
    getSecteurs(),
  ])

  const images = (a.annonce_images ?? [])
    .slice()
    .sort((x, y) => {
      if (x.is_main && !y.is_main) return -1
      if (!x.is_main && y.is_main) return 1
      return x.order_index - y.order_index
    })
    .map((img) => ({
      url: img.url,
      thumbnail_url: img.thumbnail_url ?? img.url,
      is_main: img.is_main,
    }))

  const options = Array.isArray(a.options)
    ? (a.options as unknown[]).filter((o): o is string => typeof o === "string")
    : []

  const initialValues: AnnonceFormValues = {
    condition: a.condition ?? "occasion",
    brandId: a.brand_id ?? "",
    modelId: a.model_id ?? "",
    cityId: a.city_id ?? "",
    secteurId: a.secteur_id ?? "",
    year: a.year ?? new Date().getFullYear(),
    mileage: a.mileage,
    fuelType: a.fuel_type,
    transmission: a.transmission,
    doors: a.doors,
    seats: a.seats,
    color: a.color ?? "",
    origine: a.origine ?? null,
    enginePower: a.engine_power,
    engineSize: a.engine_size,
    firstOwner: a.first_owner,
    accidentFree: a.accident_free,
    options,
    title: a.title ?? "",
    description: a.description ?? "",
    price: a.price ?? 0,
    negotiable: false,
    priceOnRequest: a.price_on_request ?? false,
    contactPhone: a.contact_phone ?? "",
    contactWhatsapp: a.contact_whatsapp ?? null,
    videoUrl: a.video_url ?? null,
    images,
    acceptTerms: true,
  }

  return (
    <section className="py-8 md:py-12">
      <Container>
        <header className="space-y-3 mb-8 max-w-2xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            {t("title")}
          </h1>
          <GoldAccent />
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </header>

        <AjouterWizard
          mode="edit"
          annonceId={a.id}
          initialValues={initialValues}
          brands={brands}
          models={models}
          cities={cities}
          secteurs={secteurs}
          defaultPhone={a.contact_phone ?? ""}
          defaultWhatsapp={a.contact_whatsapp ?? ""}
          isPro={isPro}
        />
      </Container>
    </section>
  )
}

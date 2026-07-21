import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { ArrowLeft } from "lucide-react"

import { AjouterWizard } from "@/components/forms/AjouterAnnonce/AjouterWizard"
import { Link } from "@/i18n/navigation"
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

export default async function AdminEditAnnoncePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const supabase = await createClient()

  const { data } = await supabase
    .from("annonces")
    .select(
      `id, condition, brand_id, model_id, city_id, secteur_id, year,
       mileage, fuel_type, transmission, doors, seats, color, origine,
       engine_power, engine_size, first_owner, accident_free, options, title,
       description, price, price_on_request, negotiable, contact_phone, contact_whatsapp, video_url,
       annonce_images(url, thumbnail_url, is_main, order_index)`,
    )
    .eq("id", id)
    .maybeSingle()

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
    negotiable: a.negotiable ?? false,
    priceOnRequest: a.price_on_request ?? false,
    contactPhone: a.contact_phone ?? "",
    contactWhatsapp: a.contact_whatsapp ?? null,
    videoUrl: a.video_url ?? null,
    images,
    acceptTerms: true,
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl">
      <header className="space-y-2">
        <Link
          href="/admin/annonces"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {locale === "ar" ? "الإعلانات" : "Annonces"}
        </Link>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {locale === "ar" ? "تعديل الإعلان" : "Modifier l'annonce"}
        </h1>
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
        isPro={true}
        redirectTo="/admin/annonces"
      />
    </div>
  )
}

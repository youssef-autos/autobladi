import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { CityLanding } from "@/components/landing/CityLanding"
import { localeAlternates } from "@/lib/seo/alternates"
import { searchAnnonces } from "@/lib/queries/annonces"
import {
  getBrandsWithListingsInCity,
  getCityBySlug,
  landingFilters,
} from "@/lib/queries/landing"

export const revalidate = 300

type Params = { locale: string; city: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { locale, city: citySlug } = await params
  const city = await getCityBySlug(citySlug)
  if (!city) return { title: "Not found" }
  const t = await getTranslations({ locale, namespace: "landing" })
  const cityName = locale === "ar" ? city.name_ar : city.name_fr
  return {
    title: t("metaTitleCityHub", { city: cityName }),
    description: t("metaDescCityHub", { city: cityName }),
    alternates: localeAlternates(locale, `/villes/${city.slug}`),
  }
}

export default async function CityLandingPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale, city: citySlug } = await params
  setRequestLocale(locale)

  const city = await getCityBySlug(citySlug)
  if (!city) notFound()

  const [result, brands] = await Promise.all([
    searchAnnonces(landingFilters({ city: city.slug })),
    getBrandsWithListingsInCity(city.id),
  ])

  return (
    <CityLanding locale={locale} city={city} result={result} brands={brands} />
  )
}

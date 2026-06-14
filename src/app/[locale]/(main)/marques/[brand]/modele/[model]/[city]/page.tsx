import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { BrandCityLanding } from "@/components/landing/BrandCityLanding"
import { localeAlternates } from "@/lib/seo/alternates"
import { searchAnnonces } from "@/lib/queries/annonces"
import {
  getBrandBySlug,
  getCitiesWithListings,
  getCityBySlug,
  getModelBySlug,
  landingFilters,
} from "@/lib/queries/landing"

export const revalidate = 300

type Params = { locale: string; brand: string; model: string; city: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { locale, brand: brandSlug, model: modelSlug, city: citySlug } =
    await params
  const [brand, city] = await Promise.all([
    getBrandBySlug(brandSlug),
    getCityBySlug(citySlug),
  ])
  if (!brand || !city) return { title: "Not found" }
  const model = await getModelBySlug(brand.id, modelSlug)
  if (!model) return { title: "Not found" }
  const t = await getTranslations({ locale, namespace: "landing" })
  const subject = `${brand.name} ${model.name}`
  const cityName = locale === "ar" ? city.name_ar : city.name_fr
  return {
    title: t("metaTitleCity", { brand: subject, city: cityName }),
    description: t("metaDescCity", { brand: subject, city: cityName }),
    alternates: localeAlternates(
      locale,
      `/marques/${brand.slug}/modele/${model.slug}/${city.slug}`,
    ),
  }
}

export default async function ModelCityLandingPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale, brand: brandSlug, model: modelSlug, city: citySlug } =
    await params
  setRequestLocale(locale)

  const [brand, city] = await Promise.all([
    getBrandBySlug(brandSlug),
    getCityBySlug(citySlug),
  ])
  if (!brand || !city) notFound()
  const model = await getModelBySlug(brand.id, modelSlug)
  if (!model) notFound()

  const [result, cities] = await Promise.all([
    searchAnnonces(
      landingFilters({ brand: brand.slug, model: model.slug, city: city.slug }),
    ),
    getCitiesWithListings({ brandId: brand.id, modelId: model.id }),
  ])

  return (
    <BrandCityLanding
      locale={locale}
      brand={brand}
      model={model}
      city={city}
      result={result}
      relatedCities={cities}
    />
  )
}

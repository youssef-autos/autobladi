import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { BrandCityLanding } from "@/components/landing/BrandCityLanding"
import { localeAlternates } from "@/lib/seo/alternates"
import { searchAnnonces } from "@/lib/queries/annonces"
import {
  getBrandBySlug,
  getCitiesWithListingsForBrand,
  getCityBySlug,
  landingFilters,
} from "@/lib/queries/landing"

export const revalidate = 300

type Params = { locale: string; brand: string; city: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { locale, brand: brandSlug, city: citySlug } = await params
  const [brand, city] = await Promise.all([
    getBrandBySlug(brandSlug),
    getCityBySlug(citySlug),
  ])
  if (!brand || !city) return { title: "Not found" }
  const t = await getTranslations({ locale, namespace: "landing" })
  const cityName = locale === "ar" ? city.name_ar : city.name_fr
  return {
    title: t("metaTitleCity", { brand: brand.name, city: cityName }),
    description: t("metaDescCity", { brand: brand.name, city: cityName }),
    alternates: localeAlternates(locale, `/marques/${brand.slug}/${city.slug}`),
  }
}

export default async function BrandCityLandingPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale, brand: brandSlug, city: citySlug } = await params
  setRequestLocale(locale)

  const [brand, city] = await Promise.all([
    getBrandBySlug(brandSlug),
    getCityBySlug(citySlug),
  ])
  if (!brand || !city) notFound()

  const [result, cities] = await Promise.all([
    searchAnnonces(landingFilters({ brand: brand.slug, city: city.slug })),
    getCitiesWithListingsForBrand(brand.id),
  ])

  return (
    <BrandCityLanding
      locale={locale}
      brand={brand}
      city={city}
      result={result}
      relatedCities={cities}
    />
  )
}

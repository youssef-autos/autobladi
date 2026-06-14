import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { BrandCityLanding } from "@/components/landing/BrandCityLanding"
import { localeAlternates } from "@/lib/seo/alternates"
import { searchAnnonces } from "@/lib/queries/annonces"
import {
  getBrandBySlug,
  getCitiesWithListingsForBrand,
  landingFilters,
} from "@/lib/queries/landing"

export const revalidate = 300

type Params = { locale: string; brand: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { locale, brand: brandSlug } = await params
  const brand = await getBrandBySlug(brandSlug)
  if (!brand) return { title: "Not found" }
  const t = await getTranslations({ locale, namespace: "landing" })
  return {
    title: t("metaTitleBrand", { brand: brand.name }),
    description: t("metaDescBrand", { brand: brand.name }),
    alternates: localeAlternates(locale, `/marques/${brand.slug}`),
  }
}

export default async function BrandLandingPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale, brand: brandSlug } = await params
  setRequestLocale(locale)

  const brand = await getBrandBySlug(brandSlug)
  if (!brand) notFound()

  const [result, cities] = await Promise.all([
    searchAnnonces(landingFilters({ brand: brand.slug })),
    getCitiesWithListingsForBrand(brand.id),
  ])

  return (
    <BrandCityLanding
      locale={locale}
      brand={brand}
      city={null}
      result={result}
      relatedCities={cities}
    />
  )
}

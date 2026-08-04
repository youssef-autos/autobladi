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
  const title = t("metaTitleBrand", { brand: brand.name })
  const description = t("metaDescBrand", { brand: brand.name })
  return {
    title,
    description,
    alternates: localeAlternates(locale, `/marques/${brand.slug}`),
    openGraph: { title, description, type: "website" },
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

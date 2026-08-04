import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { BrandCityLanding } from "@/components/landing/BrandCityLanding"
import { localeAlternates } from "@/lib/seo/alternates"
import { searchAnnonces } from "@/lib/queries/annonces"
import {
  getBrandBySlug,
  getCitiesWithListings,
  getModelBySlug,
  landingFilters,
} from "@/lib/queries/landing"

export const revalidate = 300

type Params = { locale: string; brand: string; model: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { locale, brand: brandSlug, model: modelSlug } = await params
  const brand = await getBrandBySlug(brandSlug)
  if (!brand) return { title: "Not found" }
  const model = await getModelBySlug(brand.id, modelSlug)
  if (!model) return { title: "Not found" }
  const t = await getTranslations({ locale, namespace: "landing" })
  const subject = `${brand.name} ${model.name}`
  const title = t("metaTitleBrand", { brand: subject })
  const description = t("metaDescBrand", { brand: subject })
  return {
    title,
    description,
    alternates: localeAlternates(
      locale,
      `/marques/${brand.slug}/modele/${model.slug}`,
    ),
    openGraph: { title, description, type: "website" },
  }
}

export default async function ModelLandingPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale, brand: brandSlug, model: modelSlug } = await params
  setRequestLocale(locale)

  const brand = await getBrandBySlug(brandSlug)
  if (!brand) notFound()
  const model = await getModelBySlug(brand.id, modelSlug)
  if (!model) notFound()

  const [result, cities] = await Promise.all([
    searchAnnonces(landingFilters({ brand: brand.slug, model: model.slug })),
    getCitiesWithListings({ brandId: brand.id, modelId: model.id }),
  ])

  return (
    <BrandCityLanding
      locale={locale}
      brand={brand}
      model={model}
      city={null}
      result={result}
      relatedCities={cities}
    />
  )
}

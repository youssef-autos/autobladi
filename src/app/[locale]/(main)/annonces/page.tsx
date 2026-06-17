import type { Metadata } from "next"
import { Suspense } from "react"
import { setRequestLocale, getTranslations } from "next-intl/server"

import { localeAlternates } from "@/lib/seo/alternates"

import { AdBanner } from "@/components/ads/AdBanner"
import { AnnoncesList } from "@/components/annonces/AnnoncesList"
import { FiltersSidebar } from "@/components/annonces/FiltersSidebar"
import { MobileFilters } from "@/components/annonces/MobileFilters"
import { PaginationControls } from "@/components/annonces/PaginationControls"
import { SortDropdown } from "@/components/annonces/SortDropdown"
import { ViewToggle } from "@/components/annonces/ViewToggle"
import { loadAnnoncesSearchParams } from "@/components/annonces/searchParams"
import { Container } from "@/components/ui/Container"
import { JsonLd } from "@/components/seo/JsonLd"
import { itemListSchema } from "@/lib/seo/structured-data"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { Link } from "@/i18n/navigation"
import {
  getActiveBrands,
  getActiveModels,
  getCities,
  getSecteurs,
} from "@/lib/queries/home"
import { searchAnnonces } from "@/lib/queries/annonces"

export const revalidate = 60

type SearchParams = Record<string, string | string[] | undefined>

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "annonces" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localeAlternates(locale, `/annonces`),
  }
}

export default async function AnnoncesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("annonces")

  const filters = await loadAnnoncesSearchParams(searchParams)

  const [brands, models, cities, secteurs, result] = await Promise.all([
    getActiveBrands(),
    getActiveModels(),
    getCities(),
    getSecteurs(),
    searchAnnonces(filters),
  ])

  return (
    <section className="py-8 md:py-12">
      <Container>
        {/* Page header */}
        <header className="space-y-3 mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {t("pageTitle")}
          </h1>
          <GoldAccent />
          <p className="text-muted-foreground">{t("pageSubtitle")}</p>
        </header>

        <Suspense fallback={<div className="h-[120px] md:h-[150px] rounded-2xl bg-muted animate-pulse mb-6" />}>
          <div className="mb-6">
            <AdBanner placement="listings_top" heightClass="h-[120px] md:h-[150px]" />
            <AdBanner placement="listings_top_mobile" />
          </div>
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-8">
          {/* Sidebar (desktop only) */}
          <aside className="hidden lg:flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <FiltersSidebar
                brands={brands}
                models={models}
                cities={cities}
                secteurs={secteurs}
              />
            </div>
            <Suspense fallback={<div className="h-[600px] rounded-2xl bg-muted animate-pulse" />}>
              <AdBanner
                placement="listings_sidebar"
                heightClass="h-[600px]"
              />
            </Suspense>
          </aside>

          {/* Results column */}
          <div className="min-w-0 flex flex-col gap-5">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap rounded-2xl border border-border bg-card p-4 shadow-card">
              <div>
                <p className="font-semibold text-foreground">
                  {t("resultsCount", { count: result.total })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("page", { page: result.page, total: result.totalPages })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/auth/connexion"
                  className="hidden md:inline-flex items-center h-10 px-4 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
                >
                  {t("saveSearch")}
                </Link>
                <div className="hidden md:block">
                  <SortDropdown />
                </div>
                <ViewToggle />
              </div>
            </div>

            <AnnoncesList
              annonces={result.annonces}
              view={filters.view}
              emptyTitle={t("empty.title")}
              emptyDesc={t("empty.desc")}
              emptyAction={
                <Link
                  href="/annonces"
                  className="inline-flex items-center h-10 px-4 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
                >
                  {t("clearFilters")}
                </Link>
              }
            />

            <PaginationControls page={result.page} totalPages={result.totalPages} />

            {/* Browse-by-brand strip — internal links to brand landing pages */}
            {brands.length > 0 && (
              <nav
                aria-label={t("browseByBrand")}
                className="mt-10 border-t border-border pt-6"
              >
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  {t("browseByBrand")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {brands.map((b) => (
                    <Link
                      key={b.id}
                      href={`/marques/${b.slug}`}
                      className="inline-flex items-center h-9 px-3 rounded-full border border-border bg-background text-xs font-medium text-foreground hover:border-moroccan-red-500/40 hover:text-moroccan-red-600"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              </nav>
            )}

            {/* Browse-by-city strip — internal links to city landing pages */}
            {cities.length > 0 && (
              <nav
                aria-label={t("browseByCity")}
                className="mt-6 border-t border-border pt-6"
              >
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  {t("browseByCity")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <Link
                      key={c.id}
                      href={`/villes/${c.slug}`}
                      className="inline-flex items-center h-9 px-3 rounded-full border border-border bg-background text-xs font-medium text-foreground hover:border-moroccan-red-500/40 hover:text-moroccan-red-600"
                    >
                      {locale === "ar" ? c.name_ar : c.name_fr}
                    </Link>
                  ))}
                </div>
              </nav>
            )}
          </div>
        </div>

        {/* Spacer so mobile bottom bar doesn't cover content */}
        <div className="h-20 lg:hidden" aria-hidden="true" />
      </Container>

      {/* Mobile fixed bottom bar (filters + sort) */}
      <MobileFilters
        brands={brands}
        models={models}
        cities={cities}
        secteurs={secteurs}
      />

      <JsonLd
        data={itemListSchema(
          result.annonces.map((a) => ({
            url: `${SITE_URL}/${locale}/annonces/${a.slug}`,
            name: a.title,
          })),
        )}
      />
    </section>
  )
}

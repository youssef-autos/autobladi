import { getTranslations } from "next-intl/server"
import { ChevronLeft } from "lucide-react"

import { AnnoncesList } from "@/components/annonces/AnnoncesList"
import { JsonLd } from "@/components/seo/JsonLd"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { Link } from "@/i18n/navigation"
import {
  breadcrumbSchema,
  collectionSchema,
  faqSchema,
  itemListSchema,
} from "@/lib/seo/structured-data"
import type { AnnoncesListResult } from "@/lib/queries/annonces"
import type { LandingBrandRef, LandingCity } from "@/lib/queries/landing"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

type Props = {
  locale: string
  city: LandingCity
  result: AnnoncesListResult
  brands: LandingBrandRef[]
}

const FAQ_KEYS = [1, 2, 3] as const

export async function CityLanding({ locale, city, result, brands }: Props) {
  const t = await getTranslations("landing")
  const isAr = locale === "ar"
  const cityName = isAr ? city.name_ar : city.name_fr
  const vars = { city: cityName, count: result.total }

  const basePath = `/villes/${city.slug}`
  const viewAllHref = `/annonces?city=${city.slug}`

  return (
    <section className="py-8 md:py-12">
      <Container>
        {/* Breadcrumb */}
        <nav
          aria-label="breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4"
        >
          <Link href="/" className="hover:text-moroccan-red-500">
            {t("breadcrumbHome")}
          </Link>
          <ChevronLeft className="size-3 rtl:rotate-180" aria-hidden="true" />
          <Link href="/annonces" className="hover:text-moroccan-red-500">
            {t("breadcrumbCars")}
          </Link>
          <ChevronLeft className="size-3 rtl:rotate-180" aria-hidden="true" />
          <span className="text-foreground">{cityName}</span>
        </nav>

        {/* Hero */}
        <header className="space-y-3 mb-8 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {t("cityHubTitle", vars)}
          </h1>
          <GoldAccent />
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {t("cityHubIntro", vars)}
          </p>
          <p className="text-sm font-medium text-moroccan-red-500">
            {t("count", { count: result.total })}
          </p>
        </header>

        {/* Listings */}
        <AnnoncesList
          annonces={result.annonces}
          view="grid"
          emptyTitle={t("emptyTitle")}
          emptyDesc={t("emptyDesc")}
        />

        {result.total > result.annonces.length && (
          <div className="mt-8 text-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all"
            >
              {t("viewAll")}
            </Link>
          </div>
        )}

        {/* Internal links: brands available in this city */}
        {brands.length > 0 && (
          <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold text-foreground mb-4">
              {t("brandsInCityHeading", vars)}
            </h2>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  href={`/marques/${b.slug}/${city.slug}`}
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-border bg-background text-xs font-medium text-foreground hover:border-moroccan-red-500/40 hover:text-moroccan-red-600"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-xl md:text-2xl font-bold mb-5">
            {t("faqTitle")}
          </h2>
          <div className="space-y-3">
            {FAQ_KEYS.map((n) => (
              <details
                key={n}
                className="group rounded-2xl border border-border bg-card px-5 py-4 shadow-card [&_summary]:cursor-pointer"
              >
                <summary className="flex items-center justify-between gap-3 font-semibold text-foreground list-none">
                  {t(`cityFaq.q${n}`, vars)}
                  <span className="text-moroccan-red-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {t(`cityFaq.a${n}`, vars)}
                </p>
              </details>
            ))}
          </div>
        </section>
      </Container>

      {/* Structured data */}
      <JsonLd
        data={collectionSchema({
          locale,
          path: basePath,
          name: t("cityHubTitle", vars),
          description: t("cityHubIntro", vars),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: t("breadcrumbHome"), url: `${SITE_URL}/${locale}` },
          { name: t("breadcrumbCars"), url: `${SITE_URL}/${locale}/annonces` },
          { name: cityName, url: `${SITE_URL}/${locale}${basePath}` },
        ])}
      />
      {result.annonces.length > 0 && (
        <JsonLd
          data={itemListSchema(
            result.annonces.map((a) => ({
              url: `${SITE_URL}/${locale}/annonces/${a.slug}`,
              name: a.title,
            })),
          )}
        />
      )}
      <JsonLd
        data={faqSchema(
          FAQ_KEYS.map((n) => ({
            question: t(`cityFaq.q${n}`, vars),
            answer: t(`cityFaq.a${n}`, vars),
          })),
        )}
      />
    </section>
  )
}

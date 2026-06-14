import { Fragment } from "react"
import { getTranslations } from "next-intl/server"
import { ChevronLeft, MapPin } from "lucide-react"

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
import type {
  LandingBrand,
  LandingCity,
  LandingModel,
} from "@/lib/queries/landing"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

type Props = {
  locale: string
  brand: LandingBrand
  /** When set, the page is scoped to a model ("Dacia Duster …"). */
  model?: LandingModel | null
  city: LandingCity | null
  result: AnnoncesListResult
  relatedCities: LandingCity[]
}

const FAQ_KEYS = [1, 2, 3] as const

export async function BrandCityLanding({
  locale,
  brand,
  model = null,
  city,
  result,
  relatedCities,
}: Props) {
  const t = await getTranslations("landing")
  const isAr = locale === "ar"
  const cityName = city ? (isAr ? city.name_ar : city.name_fr) : null

  // "Subject" of the page — the brand, or "brand + model". Fed to the {brand}
  // placeholder so all existing landing copy reads naturally.
  const subject = model ? `${brand.name} ${model.name}` : brand.name
  const vars = { brand: subject, city: cityName ?? "", count: result.total }
  const heading = cityName ? t("cityTitle", vars) : t("brandTitle", vars)
  const intro = cityName ? t("cityIntro", vars) : t("brandIntro", vars)

  const brandHub = `/marques/${brand.slug}`
  const modelHub = model ? `${brandHub}/modele/${model.slug}` : null
  const hub = modelHub ?? brandHub // non-city version of the current subject

  const basePath = city ? `${hub}/${city.slug}` : hub
  const cityHref = (slug: string) => `${hub}/${slug}`
  const viewAllHref =
    `/annonces?brand=${brand.slug}` +
    (model ? `&model=${model.slug}` : "") +
    (city ? `&city=${city.slug}` : "")

  // Breadcrumb trail: Home → Cars → Brand → [Model] → [City]
  const trail: { name: string; href: string }[] = [
    { name: t("breadcrumbHome"), href: "/" },
    { name: t("breadcrumbCars"), href: "/annonces" },
    { name: brand.name, href: brandHub },
    ...(model ? [{ name: model.name, href: modelHub as string }] : []),
    ...(city ? [{ name: cityName as string, href: basePath }] : []),
  ]

  return (
    <section className="py-8 md:py-12">
      <Container>
        {/* Breadcrumb */}
        <nav
          aria-label="breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-4"
        >
          {trail.map((c, i) => {
            const last = i === trail.length - 1
            return (
              <Fragment key={c.href}>
                {i > 0 && (
                  <ChevronLeft className="size-3 rtl:rotate-180" aria-hidden="true" />
                )}
                {last ? (
                  <span className="text-foreground">{c.name}</span>
                ) : (
                  <Link href={c.href} className="hover:text-moroccan-red-500">
                    {c.name}
                  </Link>
                )}
              </Fragment>
            )
          })}
        </nav>

        {/* Hero */}
        <header className="space-y-3 mb-8 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {heading}
          </h1>
          <GoldAccent />
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {intro}
          </p>
          <p className="text-sm font-medium text-moroccan-red-500">
            {t("count", { count: result.total })}
          </p>
        </header>

        {/* Listings grid */}
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

        {/* Internal links: subject × city */}
        {relatedCities.length > 0 && (
          <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold text-foreground mb-4">
              {t("citiesHeading", { brand: subject })}
            </h2>
            <div className="flex flex-wrap gap-2">
              {city && (
                <Link
                  href={hub}
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-moroccan-gold-500/50 bg-moroccan-gold-50/40 text-xs font-medium text-moroccan-gold-700 hover:bg-moroccan-gold-50"
                >
                  {t("backToBrand", { brand: subject })}
                </Link>
              )}
              {relatedCities
                .filter((c) => c.id !== city?.id)
                .map((c) => (
                  <Link
                    key={c.id}
                    href={cityHref(c.slug)}
                    className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-border bg-background text-xs font-medium text-foreground hover:border-moroccan-red-500/40 hover:text-moroccan-red-600"
                  >
                    <MapPin className="size-3 text-moroccan-mint-500" aria-hidden="true" />
                    {isAr ? c.name_ar : c.name_fr}
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
                  {t(`faq.q${n}`, vars)}
                  <span className="text-moroccan-red-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {t(`faq.a${n}`, vars)}
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
          name: heading,
          description: intro,
        })}
      />
      <JsonLd
        data={breadcrumbSchema(
          trail.map((c) => ({
            name: c.name,
            url: c.href === "/" ? `${SITE_URL}/${locale}` : `${SITE_URL}/${locale}${c.href}`,
          })),
        )}
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
            question: t(`faq.q${n}`, vars),
            answer: t(`faq.a${n}`, vars),
          })),
        )}
      />
    </section>
  )
}

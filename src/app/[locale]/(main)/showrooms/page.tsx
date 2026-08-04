import type { Metadata } from "next"
import { Building2 } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ShowroomListCard } from "@/components/showroom/ShowroomListCard"
import { ShowroomsFilters } from "@/components/showroom/ShowroomsFilters"
import { loadShowroomsSearchParams } from "@/components/showroom/searchParams"
import { PaginationControls } from "@/components/annonces/PaginationControls"
import { Container } from "@/components/ui/Container"
import { EmptyState } from "@/components/ui/EmptyState"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { getCities } from "@/lib/queries/home"
import { listShowrooms } from "@/lib/queries/showrooms"
import { localeAlternates } from "@/lib/seo/alternates"
import { JsonLd } from "@/components/seo/JsonLd"
import { breadcrumbSchema, collectionSchema, itemListSchema } from "@/lib/seo/structured-data"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

export const revalidate = 60

type SearchParams = Record<string, string | string[] | undefined>

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "showrooms" })
  const title = t("metaTitle")
  const description = t("metaDescription")
  return {
    title,
    description,
    alternates: localeAlternates(locale, `/showrooms`),
    openGraph: { title, description, type: "website" },
  }
}

export default async function ShowroomsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("showrooms.list")

  const filters = await loadShowroomsSearchParams(searchParams)
  const [cities, result] = await Promise.all([
    getCities(),
    listShowrooms({
      q: filters.q || undefined,
      city: filters.city || undefined,
      minRating: filters.minRating ?? undefined,
      sort: filters.sort,
      page: filters.page,
    }),
  ])

  return (
    <section className="py-8 md:py-12">
      <Container>
        <header className="space-y-3 mb-8 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {t("title")}
          </h1>
          <GoldAccent />
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </header>

        <ShowroomsFilters cities={cities} />

        <p className="mt-6 mb-4 text-sm text-muted-foreground">
          {t("resultsCount", { count: result.total })}
        </p>

        {result.items.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-12 shadow-card mt-4">
            <EmptyState
              icon={Building2}
              title={t("empty")}
              description={t("emptyDesc")}
            />
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 items-stretch">
            {result.items.map((dealer) => (
              <li key={dealer.id} className="flex">
                <ShowroomListCard dealer={dealer} className="w-full" />
              </li>
            ))}
          </ul>
        )}

        <PaginationControls
          page={result.page}
          totalPages={result.totalPages}
        />
      </Container>

      <JsonLd
        data={itemListSchema(
          result.items.map((d) => ({
            url: `${SITE_URL}/${locale}/showroom/${d.slug}`,
            name: d.name,
          })),
        )}
      />
      <JsonLd
        data={collectionSchema({
          locale,
          path: "/showrooms",
          name: t("title"),
          description: t("subtitle"),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          {
            name: locale === "fr" ? "Accueil" : "الرئيسية",
            url: `${SITE_URL}/${locale}`,
          },
          {
            name: t("title"),
            url: `${SITE_URL}/${locale}/showrooms`,
          },
        ])}
      />
    </section>
  )
}

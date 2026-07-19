import type { Metadata } from "next"
import { Building2 } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ProfessionnelListCard } from "@/components/professionnels/ProfessionnelListCard"
import { ProfessionnelsFilters } from "@/components/professionnels/ProfessionnelsFilters"
import { loadProfessionnelsSearchParams } from "@/components/professionnels/searchParams"
import { PaginationControls } from "@/components/annonces/PaginationControls"
import { Container } from "@/components/ui/Container"
import { EmptyState } from "@/components/ui/EmptyState"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { getCities } from "@/lib/queries/home"
import { listProfessionnels } from "@/lib/queries/professionnels"
import { localeAlternates } from "@/lib/seo/alternates"
import { JsonLd } from "@/components/seo/JsonLd"
import { itemListSchema } from "@/lib/seo/structured-data"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

export const revalidate = 60

type SearchParams = Record<string, string | string[] | undefined>

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "professionnels" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localeAlternates(locale, `/showrooms`),
  }
}

export default async function ProfessionnelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("professionnels.list")

  const filters = await loadProfessionnelsSearchParams(searchParams)
  const [cities, result] = await Promise.all([
    getCities(),
    listProfessionnels({
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

        <ProfessionnelsFilters cities={cities} />

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
                <ProfessionnelListCard dealer={dealer} className="w-full" />
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
    </section>
  )
}

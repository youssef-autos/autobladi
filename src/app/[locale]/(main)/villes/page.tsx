import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { JsonLd } from "@/components/seo/JsonLd"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { Link } from "@/i18n/navigation"
import { getCities } from "@/lib/queries/home"
import { localeAlternates } from "@/lib/seo/alternates"
import {
  breadcrumbSchema,
  collectionSchema,
  itemListSchema,
} from "@/lib/seo/structured-data"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

export const dynamic = "force-static"
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "landing" })
  const title = t("metaTitleVillesHub")
  const description = t("metaDescVillesHub")
  return {
    title,
    description,
    alternates: localeAlternates(locale, `/villes`),
    openGraph: { title, description, type: "website" },
  }
}

export default async function VillesHubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const isAr = locale === "ar"
  const t = await getTranslations("landing")
  const cities = await getCities()

  return (
    <section className="py-8 md:py-12">
      <Container>
        <nav
          aria-label="breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4"
        >
          <Link href="/" className="hover:text-moroccan-red-500">
            {t("breadcrumbHome")}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{t("villesHubTitle")}</span>
        </nav>

        <header className="space-y-3 mb-8 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {t("villesHubTitle")}
          </h1>
          <GoldAccent />
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {t("villesHubIntro")}
          </p>
        </header>

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {cities.map((c) => (
            <li key={c.id}>
              <Link
                href={`/villes/${c.slug}`}
                className="flex items-center justify-center h-14 px-4 rounded-2xl border border-border bg-card shadow-card hover:-translate-y-0.5 hover:border-moroccan-gold-500/40 hover:shadow-soft transition-all"
              >
                <span className="font-medium text-foreground truncate">
                  {isAr ? c.name_ar : c.name_fr}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      <JsonLd
        data={collectionSchema({
          locale,
          path: "/villes",
          name: t("villesHubTitle"),
          description: t("villesHubIntro"),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: t("breadcrumbHome"), url: `${SITE_URL}/${locale}` },
          { name: t("villesHubTitle"), url: `${SITE_URL}/${locale}/villes` },
        ])}
      />
      <JsonLd
        data={itemListSchema(
          cities.map((c) => ({
            url: `${SITE_URL}/${locale}/villes/${c.slug}`,
            name: isAr ? c.name_ar : c.name_fr,
          })),
        )}
      />
    </section>
  )
}

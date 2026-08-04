import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { JsonLd } from "@/components/seo/JsonLd"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { Link } from "@/i18n/navigation"
import { getActiveBrands } from "@/lib/queries/home"
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
  const title = t("metaTitleMarquesHub")
  const description = t("metaDescMarquesHub")
  return {
    title,
    description,
    alternates: localeAlternates(locale, `/marques`),
    openGraph: { title, description, type: "website" },
  }
}

export default async function MarquesHubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("landing")
  const brands = await getActiveBrands()

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
          <span className="text-foreground">{t("marquesHubTitle")}</span>
        </nav>

        <header className="space-y-3 mb-8 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {t("marquesHubTitle")}
          </h1>
          <GoldAccent />
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {t("marquesHubIntro")}
          </p>
        </header>

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {brands.map((b) => (
            <li key={b.id}>
              <Link
                href={`/marques/${b.slug}`}
                className="flex items-center gap-3 h-16 px-4 rounded-2xl border border-border bg-card shadow-card hover:-translate-y-0.5 hover:border-moroccan-gold-500/40 hover:shadow-soft transition-all"
              >
                {b.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.logo_url}
                    alt={b.name}
                    className="size-8 shrink-0 object-contain"
                    loading="lazy"
                  />
                ) : null}
                <span className="font-medium text-foreground truncate">
                  {b.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      <JsonLd
        data={collectionSchema({
          locale,
          path: "/marques",
          name: t("marquesHubTitle"),
          description: t("marquesHubIntro"),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: t("breadcrumbHome"), url: `${SITE_URL}/${locale}` },
          { name: t("marquesHubTitle"), url: `${SITE_URL}/${locale}/marques` },
        ])}
      />
      <JsonLd
        data={itemListSchema(
          brands.map((b) => ({
            url: `${SITE_URL}/${locale}/marques/${b.slug}`,
            name: b.name,
          })),
        )}
      />
    </section>
  )
}

import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ComparePageClient } from "./ComparePageClient"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { localeAlternates } from "@/lib/seo/alternates"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "compare" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localeAlternates(locale, `/comparer`),
    robots: { index: false, follow: true },
  }
}

export default async function ComparerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("compare")

  return (
    <section className="py-8 md:py-12">
      <Container>
        <header className="space-y-3 mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {t("pageTitle")}
          </h1>
          <GoldAccent />
          <p className="text-muted-foreground">{t("pageSubtitle")}</p>
        </header>

        <ComparePageClient />
      </Container>
    </section>
  )
}

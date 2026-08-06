import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { BlogContent } from "@/components/blog/BlogContent"
import { JsonLd } from "@/components/seo/JsonLd"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { getPageBySlug } from "@/lib/queries/pages"
import { localeAlternates } from "@/lib/seo/alternates"
import { breadcrumbSchema } from "@/lib/seo/structured-data"

export const dynamic = "force-static"
export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return {}
  const title = locale === "ar" ? page.title_ar : page.title_fr
  const rawContent = locale === "ar" ? page.content_ar : page.content_fr
  const description = (rawContent ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160)
  const fullTitle = `${title} — autobladi.ma`
  return {
    title: fullTitle,
    description: description || undefined,
    alternates: localeAlternates(locale, `/p/${slug}`),
    openGraph: { title: fullTitle, description, type: "website" },
  }
}

export default async function ContentPageView({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const page = await getPageBySlug(slug)
  if (!page) notFound()

  const isAr = locale === "ar"
  const title = isAr ? page.title_ar : page.title_fr
  const content = (isAr ? page.content_ar : page.content_fr) ?? ""
  const tNav = await getTranslations("nav")

  return (
    <article className="py-10 md:py-16">
      <Container className="max-w-3xl">
        <header className="mb-8 space-y-3">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {title}
          </h1>
          <GoldAccent />
        </header>

        {content.trim() ? (
          <BlogContent content={content} injectAdAfterWords={null} />
        ) : (
          <p className="text-muted-foreground">—</p>
        )}
      </Container>

      <JsonLd
        data={breadcrumbSchema([
          { name: tNav("home"), url: `${SITE_URL}/${locale}` },
          { name: title, url: `${SITE_URL}/${locale}/p/${slug}` },
        ])}
      />
    </article>
  )
}

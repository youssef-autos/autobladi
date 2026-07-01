import { Suspense } from "react"
import type { Metadata } from "next"
import { Newspaper } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AdBanner } from "@/components/ads/AdBanner"
import { BlogCard } from "@/components/blog/BlogCard"
import { BlogPagination } from "@/components/blog/BlogPagination"
import { BlogSearch } from "@/components/blog/BlogSearch"
import { BlogSidebar } from "@/components/blog/BlogSidebar"
import { CategoriesNav } from "@/components/blog/CategoriesNav"
import { FeaturedPost } from "@/components/blog/FeaturedPost"
import { Container } from "@/components/ui/Container"
import { EmptyState } from "@/components/ui/EmptyState"
import { GoldAccent } from "@/components/ui/GoldAccent"
import {
  getFeaturedPost,
  listCategoriesWithCounts,
  listPosts,
} from "@/lib/queries/blog"
import { localeAlternates } from "@/lib/seo/alternates"

export const revalidate = 60

type SearchParams = Record<string, string | string[] | undefined>

function readStringParam(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (Array.isArray(value) && value[0]) return value[0]
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "blog" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localeAlternates(locale, `/blog`),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  }
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams])
  setRequestLocale(locale)
  const t = await getTranslations("blog")

  const pageParam = readStringParam(sp.page)
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const q = readStringParam(sp.q)

  const [categories, featured, result] = await Promise.all([
    listCategoriesWithCounts(),
    page === 1 && !q ? getFeaturedPost() : Promise.resolve(null),
    listPosts({ page, q }),
  ])

  // On the first page (and only when not searching), the featured post is
  // pulled out of the regular grid so it isn't shown twice.
  const gridPosts =
    featured && page === 1
      ? result.posts.filter((p) => p.id !== featured.id)
      : result.posts

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-moroccan-gradient text-white">
        <div
          className="absolute -end-20 -top-20 size-64 rounded-full bg-moroccan-gold-500/20 blur-3xl"
          aria-hidden="true"
        />
        <Container className="relative py-12 md:py-16">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-moroccan-gold-500">
              <Newspaper className="size-4" aria-hidden="true" />
              {t("hero.eyebrow")}
            </p>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-white/85">{t("hero.subtitle")}</p>
          </div>
        </Container>
      </section>

      <Container className="py-8 md:py-12 space-y-8">
        <Suspense fallback={<div className="h-[120px] md:h-[150px] rounded-2xl bg-muted animate-pulse" />}>
          <AdBanner placement="blog_top" />
        </Suspense>

        {/* Search visible on mobile only — desktop uses the sidebar search */}
        <div className="lg:hidden">
          <BlogSearch />
        </div>

        <CategoriesNav categories={categories} activeSlug={null} />

        {featured && (
          <section className="space-y-4">
            <FeaturedPost post={featured} />
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="min-w-0 space-y-6">
            <header className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {q ? `"${q}"` : t("list.title")}
              </h2>
              <GoldAccent />
              <p className="text-sm text-muted-foreground">
                {t("list.count", { count: result.total })}
              </p>
            </header>

            {gridPosts.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title={t("list.empty")}
                description={t("list.emptyDesc")}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gridPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}

            <BlogPagination
              page={result.page}
              totalPages={result.totalPages}
              basePath={`/${locale}/blog`}
              preserveParams={{ q }}
            />
          </div>

          {/* Sidebar hidden on mobile — search is in main area, cats in CategoriesNav */}
          <div className="hidden lg:block">
            <BlogSidebar />
          </div>
        </div>
      </Container>
    </>
  )
}

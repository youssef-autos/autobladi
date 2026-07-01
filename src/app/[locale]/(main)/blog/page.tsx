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

function readStringParam(value: string | string[] | undefined): string | null {
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

  const gridPosts =
    featured && page === 1
      ? result.posts.filter((p) => p.id !== featured.id)
      : result.posts

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-moroccan-gradient text-white">
        <div
          className="absolute -end-20 -top-20 size-72 rounded-full bg-moroccan-gold-500/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <Container className="relative py-7 md:py-12">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-moroccan-gold-400 mb-2">
            <Newspaper className="size-3.5" aria-hidden="true" />
            {t("hero.eyebrow")}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            {t("hero.title")}
          </h1>
          <p className="hidden sm:block text-white/80 mt-2 text-sm md:text-base max-w-xl">
            {t("hero.subtitle")}
          </p>
        </Container>
      </section>

      {/* ── Main content ─────────────────────────────────────── */}
      <Container className="py-6 md:py-10 overflow-x-hidden">

        {/* Ad banner */}
        <Suspense
          fallback={
            <div className="h-[80px] md:h-[120px] rounded-2xl bg-muted animate-pulse mb-6" />
          }
        >
          <div className="mb-6">
            <AdBanner placement="blog_top" />
          </div>
        </Suspense>

        {/* Search — mobile / tablet only (desktop uses sidebar search) */}
        <div className="lg:hidden mb-3">
          <BlogSearch />
        </div>

        {/* Category tabs */}
        <CategoriesNav categories={categories} activeSlug={null} />

        {/* Two-column: articles + sidebar */}
        <div className="mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 md:gap-10 items-start">

          {/* Articles column */}
          <div className="min-w-0 space-y-8 md:space-y-10">

            {/* Featured post */}
            {featured && <FeaturedPost post={featured} />}

            {/* Latest articles */}
            <section>
              <div className="flex items-center justify-between gap-4 mb-1">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {q ? `"${q}"` : t("list.title")}
                </h2>
                <p className="text-sm text-muted-foreground shrink-0">
                  {t("list.count", { count: result.total })}
                </p>
              </div>
              <GoldAccent className="mb-5" />

              {gridPosts.length === 0 ? (
                <EmptyState
                  icon={Newspaper}
                  title={t("list.empty")}
                  description={t("list.emptyDesc")}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            </section>
          </div>

          {/* Sidebar (desktop only) */}
          <div className="hidden lg:block">
            <BlogSidebar />
          </div>
        </div>

        {/* Mobile / tablet: sidebar content below articles */}
        <div className="mt-8 lg:hidden">
          <BlogSidebar showAd={false} hideSearch />
        </div>
      </Container>
    </>
  )
}

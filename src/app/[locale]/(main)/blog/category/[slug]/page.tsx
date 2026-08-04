import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Newspaper } from "lucide-react"
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server"

import { BlogCard } from "@/components/blog/BlogCard"
import { BlogPagination } from "@/components/blog/BlogPagination"
import { BlogSidebar } from "@/components/blog/BlogSidebar"
import { CategoriesNav } from "@/components/blog/CategoriesNav"
import { Link } from "@/i18n/navigation"
import { Container } from "@/components/ui/Container"
import { EmptyState } from "@/components/ui/EmptyState"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { JsonLd } from "@/components/seo/JsonLd"
import {
  getCategoryBySlug,
  listCategoriesWithCounts,
  listPosts,
} from "@/lib/queries/blog"
import { localeAlternates } from "@/lib/seo/alternates"
import {
  breadcrumbSchema,
  collectionSchema,
  itemListSchema,
} from "@/lib/seo/structured-data"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

export const revalidate = 60

type RouteParams = { locale: string; slug: string }
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
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: "Not found" }
  const t = await getTranslations({ locale, namespace: "blog.category" })
  const name = locale === "fr" ? category.name_fr : category.name_ar
  const title = t("metaTitle", { name })
  const description = t("metaDescription", { name })
  return {
    title,
    description,
    alternates: localeAlternates(locale, `/blog/category/${slug}`),
    openGraph: { title, description, type: "website" },
  }
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>
  searchParams: Promise<SearchParams>
}) {
  const [{ locale, slug }, sp] = await Promise.all([params, searchParams])
  setRequestLocale(locale)
  const t = await getTranslations("blog")
  const locale_ = await getLocale()

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const pageParam = readStringParam(sp.page)
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const q = readStringParam(sp.q)

  const [categories, result] = await Promise.all([
    listCategoriesWithCounts(),
    listPosts({ page, q, categorySlug: slug }),
  ])

  const name = locale_ === "fr" ? category.name_fr : category.name_ar

  return (
    <Container className="py-8 md:py-12 space-y-8">
      <header className="space-y-3">
        <Link
          href="/blog"
          className="text-xs text-muted-foreground hover:text-moroccan-red-500"
        >
          ← {t("category.back")}
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          {t("category.title", { name })}
        </h1>
        <GoldAccent />
        <p className="text-sm text-muted-foreground">
          {t("list.count", { count: result.total })}
        </p>
      </header>

      <CategoriesNav categories={categories} activeSlug={slug} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="min-w-0 space-y-6">
          {result.posts.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title={t("list.categoryEmpty")}
              description={t("list.emptyDesc")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <BlogPagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={`/${locale}/blog/category/${slug}`}
            preserveParams={{ q }}
          />
        </div>

        <BlogSidebar />
      </div>

      <JsonLd
        data={collectionSchema({
          locale,
          path: `/blog/category/${slug}`,
          name: t("category.title", { name }),
          description: t("list.count", { count: result.total }),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          {
            name: locale === "fr" ? "Accueil" : "الرئيسية",
            url: `${SITE_URL}/${locale}`,
          },
          {
            name: locale === "fr" ? "Blog" : "المدونة",
            url: `${SITE_URL}/${locale}/blog`,
          },
          {
            name,
            url: `${SITE_URL}/${locale}/blog/category/${slug}`,
          },
        ])}
      />
      {result.posts.length > 0 && (
        <JsonLd
          data={itemListSchema(
            result.posts.map((p) => ({
              url: `${SITE_URL}/${locale}/blog/${p.slug}`,
              name: p.title,
            })),
          )}
        />
      )}
    </Container>
  )
}

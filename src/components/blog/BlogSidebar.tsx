import { Suspense } from "react"
import Image from "next/image"
import { Rss } from "lucide-react"
import { getFormatter, getLocale, getTranslations } from "next-intl/server"

import { AdBanner } from "@/components/ads/AdBanner"
import { BlogSearch } from "@/components/blog/BlogSearch"
import { Link } from "@/i18n/navigation"
import {
  listCategoriesWithCounts,
  listLatestPosts,
  type BlogCategoryWithCount,
  type BlogPostCard,
} from "@/lib/queries/blog"

type Props = {
  showAd?: boolean
  /** Hide the search input (e.g. when a search bar is already visible above). */
  hideSearch?: boolean
}

export async function BlogSidebar({ showAd = true, hideSearch = false }: Props) {
  const t = await getTranslations("blog")
  const [categories, latest] = await Promise.all([
    listCategoriesWithCounts(),
    listLatestPosts(5),
  ])

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      {!hideSearch && <BlogSearch />}

      <CategoriesBox categories={categories} />

      <LatestPosts posts={latest} />

      {showAd && (
        <Suspense
          fallback={
            <div className="hidden lg:block h-[600px] rounded-2xl bg-muted animate-pulse" />
          }
        >
          <div className="hidden lg:block">
            <AdBanner placement="blog_sidebar" heightClass="h-[600px]" />
          </div>
        </Suspense>
      )}

      <NewsletterBox />

      <a
        href="/feed.xml"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-moroccan-red-500"
      >
        <Rss className="size-3.5" aria-hidden="true" />
        {t("rss.title")}
      </a>
    </aside>
  )
}

async function CategoriesBox({
  categories,
}: {
  categories: BlogCategoryWithCount[]
}) {
  const t = await getTranslations("blog.sidebar")
  const locale = await getLocale()
  if (categories.length === 0) return null
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-display text-base font-bold text-foreground mb-3">
        {t("categories")}
      </h3>
      <ul className="space-y-1">
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/blog/category/${cat.slug}`}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground/80 hover:bg-moroccan-sand-50 hover:text-foreground"
            >
              <span className="truncate">
                {locale === "fr" ? cat.name_fr : cat.name_ar}
              </span>
              {cat.posts_count > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {cat.posts_count}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

async function LatestPosts({ posts }: { posts: BlogPostCard[] }) {
  const t = await getTranslations("blog.sidebar")
  const fmt = await getFormatter()
  if (posts.length === 0) return null
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-display text-base font-bold text-foreground mb-3">
        {t("latest")}
      </h3>
      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/blog/${post.slug}`}
              className="flex gap-3 items-start group"
            >
              {post.cover_image ? (
                <span className="relative shrink-0 size-14 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={post.cover_image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="shrink-0 size-14 rounded-lg bg-moroccan-sand-50" />
              )}
              <span className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-moroccan-red-500">
                  {post.title}
                </p>
                {post.published_at && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {fmt.dateTime(new Date(post.published_at), {
                      dateStyle: "medium",
                    })}
                  </p>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

async function NewsletterBox() {
  const t = await getTranslations("blog.sidebar.newsletter")
  return (
    <section className="rounded-2xl bg-moroccan-gradient text-white p-5 shadow-moroccan">
      <h3 className="font-display text-base font-bold">{t("title")}</h3>
      <p className="text-xs text-white/80 mt-1">{t("desc")}</p>
      <form action="/api/newsletter" method="post" className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder={t("placeholder")}
          className="flex-1 min-w-0 rounded-lg bg-white/10 border border-white/20 px-3 h-9 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-moroccan-gold-500/70"
        />
        <button
          type="submit"
          className="rounded-lg bg-moroccan-gold-500 px-3 h-9 text-xs font-semibold text-brand-dark hover:bg-moroccan-gold-400"
        >
          {t("subscribe")}
        </button>
      </form>
    </section>
  )
}

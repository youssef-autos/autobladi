import Image from "next/image"
import { ArrowRight, Calendar, Clock } from "lucide-react"
import { getFormatter, getLocale, getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import type { BlogPostCard } from "@/lib/queries/blog"

type Props = {
  post: BlogPostCard
}

export async function FeaturedPost({ post }: Props) {
  const t = await getTranslations("blog")
  const fmt = await getFormatter()
  const locale = await getLocale()
  const categoryName =
    locale === "fr" ? post.category?.name_fr : post.category?.name_ar

  return (
    <Link
      href={`/blog/${post.slug}`}
      aria-label={post.title}
      className="group grid grid-cols-1 overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card shadow-card transition-all hover:border-moroccan-red-200 hover:shadow-soft lg:grid-cols-2"
    >
      {/* Image — on top (mobile) / to the side (desktop). Text never sits over it. */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted lg:aspect-auto lg:min-h-[300px]">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-moroccan-gradient" aria-hidden="true" />
        )}
        {categoryName && (
          <span className="absolute top-4 start-4 inline-flex items-center rounded-full bg-moroccan-red-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
            {categoryName}
          </span>
        )}
      </div>

      {/* Content — below (mobile) / beside (desktop) */}
      <div className="flex flex-col justify-center p-5 sm:p-7 md:p-8 lg:p-10">
        <span className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-moroccan-gold-600">
          ★ {t("featured.label")}
        </span>

        <h2 className="font-display text-xl font-bold leading-tight text-foreground transition-colors line-clamp-3 group-hover:text-moroccan-red-500 sm:text-2xl md:text-3xl">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            {post.excerpt}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {post.published_at && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" aria-hidden="true" />
              {fmt.dateTime(new Date(post.published_at), { dateStyle: "medium" })}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {t("card.readingTime", { minutes: post.reading_minutes })}
          </span>
        </div>

        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-moroccan-red-500">
          {t("card.readMore")}
          <ArrowRight
            className="size-4 transition-transform duration-200 rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  )
}

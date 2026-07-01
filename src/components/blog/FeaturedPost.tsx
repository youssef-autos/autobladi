import Image from "next/image"
import { ArrowRight, Calendar, Clock } from "lucide-react"
import { getFormatter, getLocale, getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { Badge } from "@/components/ui/badge"
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
      className="group relative block overflow-hidden rounded-2xl md:rounded-3xl isolate bg-brand-dark shadow-moroccan"
      aria-label={post.title}
    >
      {/* Hero image */}
      <div className="relative h-[240px] sm:h-[340px] md:h-[420px] lg:h-[460px]">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(max-width: 1280px) 100vw, 90vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-moroccan-gradient opacity-30" aria-hidden="true" />
        )}
        {/* Gradient overlay — readable text at all image brightness levels */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/45 to-transparent"
          aria-hidden="true"
        />
      </div>

      {/* Content overlaid at bottom */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8 lg:p-10">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <Badge variant="featured" className="text-[11px] font-semibold">
            ★ {t("featured.label")}
          </Badge>
          {categoryName && (
            <span className="text-[11px] font-medium text-white/60 uppercase tracking-wide">
              {categoryName}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-display text-lg sm:text-2xl md:text-4xl font-bold text-white leading-tight max-w-3xl group-hover:text-moroccan-gold-100 transition-colors duration-200">
          {post.title}
        </h2>

        {/* Excerpt — sm+ only */}
        {post.excerpt && (
          <p className="hidden sm:block text-sm md:text-base text-white/60 mt-2 line-clamp-2 max-w-2xl">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 sm:mt-3 text-xs text-white/50">
          {post.author?.full_name && (
            <span className="font-medium text-white/70">{post.author.full_name}</span>
          )}
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" aria-hidden="true" />
              {fmt.dateTime(new Date(post.published_at), { dateStyle: "medium" })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {t("card.readingTime", { minutes: post.reading_minutes })}
          </span>
        </div>

        {/* CTA arrow */}
        <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-moroccan-gold-400 group-hover:text-moroccan-gold-300 transition-colors">
          {t("card.readMore")}
          <ArrowRight
            className="size-4 rtl:rotate-180 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  )
}

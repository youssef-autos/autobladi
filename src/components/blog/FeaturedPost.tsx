import Image from "next/image"
import { ArrowRight, Clock } from "lucide-react"
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
    <article className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Cover */}
        <Link
          href={`/blog/${post.slug}`}
          className="relative block aspect-[16/10] md:aspect-auto md:min-h-[320px] bg-muted overflow-hidden"
        >
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-moroccan-gradient opacity-20" aria-hidden="true" />
          )}
          <Badge
            variant="featured"
            className="absolute top-4 start-4 text-[11px] font-semibold uppercase tracking-wide"
          >
            ★ {t("featured.label")}
          </Badge>
        </Link>

        {/* Content */}
        <div className="p-5 md:p-8 lg:p-10 flex flex-col gap-3 md:gap-4 justify-center">
          {categoryName && (
            <span className="text-xs font-semibold uppercase tracking-wider text-moroccan-red-500">
              {categoryName}
            </span>
          )}

          <Link href={`/blog/${post.slug}`}>
            <h2 className="font-display text-xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight group-hover:text-moroccan-red-500 transition-colors">
              {post.title}
            </h2>
          </Link>

          {post.excerpt && (
            <p className="text-sm md:text-base text-muted-foreground line-clamp-2 md:line-clamp-3">{post.excerpt}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
            <span className="truncate min-w-0">
              {post.author?.full_name ?? "—"}
              {post.published_at && (
                <>
                  {" · "}
                  {fmt.dateTime(new Date(post.published_at), { dateStyle: "medium" })}
                </>
              )}
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock className="size-3.5" aria-hidden="true" />
              {t("card.readingTime", { minutes: post.reading_minutes })}
            </span>
          </div>

          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-2 mt-1 text-sm font-semibold text-moroccan-red-500 hover:text-moroccan-red-600"
          >
            {t("card.readMore")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}

import Image from "next/image"
import { Clock } from "lucide-react"
import { getFormatter, getLocale, getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import type { BlogPostCard } from "@/lib/queries/blog"
import { cn } from "@/lib/utils"

type Props = {
  post: BlogPostCard
  className?: string
}

export async function BlogCard({ post, className }: Props) {
  const t = await getTranslations("blog")
  const fmt = await getFormatter()
  const locale = await getLocale()
  const categoryName =
    locale === "fr" ? post.category?.name_fr : post.category?.name_ar

  return (
    <article
      className={cn(
        // Mobile: horizontal row (thumbnail left, text right)
        // sm+: vertical card (image top, text below)
        "group flex flex-row sm:flex-col rounded-xl sm:rounded-2xl border border-border bg-card overflow-hidden",
        "hover:border-moroccan-red-200 hover:shadow-md transition-all duration-200",
        className,
      )}
    >
      {/* Image */}
      <Link
        href={`/blog/${post.slug}`}
        className="relative block shrink-0 w-[88px] h-[88px] sm:w-full sm:h-auto sm:aspect-[16/9] overflow-hidden bg-muted"
      >
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 88px, (max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-moroccan-sand-50 to-moroccan-sand-100"
            aria-hidden="true"
          />
        )}
        {categoryName && (
          <Badge
            variant="featured"
            className="absolute top-2 start-2 text-[10px] hidden sm:flex"
          >
            {categoryName}
          </Badge>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1 sm:gap-2 min-w-0">
        {/* Category text (mobile only — badge hidden on tiny thumbnail) */}
        {categoryName && (
          <span className="sm:hidden text-[10px] font-semibold uppercase tracking-wide text-moroccan-red-500 truncate">
            {categoryName}
          </span>
        )}

        <Link href={`/blog/${post.slug}`} className="block min-w-0">
          <h3 className="font-display text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-3 sm:line-clamp-2 group-hover:text-moroccan-red-500 transition-colors">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="hidden sm:block text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto pt-2 sm:pt-3 sm:border-t sm:border-border text-[11px] text-muted-foreground">
          <span className="truncate min-w-0">
            {post.published_at
              ? fmt.dateTime(new Date(post.published_at), { dateStyle: "medium" })
              : (post.author?.full_name ?? "—")}
          </span>
          <span className="flex items-center gap-0.5 shrink-0">
            <Clock className="size-3" aria-hidden="true" />
            {t("card.readingTime", { minutes: post.reading_minutes })}
          </span>
        </div>
      </div>
    </article>
  )
}

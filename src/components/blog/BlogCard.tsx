import Image from "next/image"
import { Clock, MessageCircle } from "lucide-react"
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
        // Mobile: horizontal (thumbnail left, text right)
        // sm+: vertical (image top, text below)
        "group flex flex-row sm:flex-col rounded-2xl border border-border bg-card shadow-card overflow-hidden hover:shadow-moroccan transition-shadow",
        className,
      )}
    >
      {/* Image — fixed thumbnail on mobile, full-width banner on sm+ */}
      <Link
        href={`/blog/${post.slug}`}
        className="relative block w-[120px] h-[110px] shrink-0 sm:w-full sm:h-auto sm:aspect-[16/10] bg-muted overflow-hidden"
      >
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 120px, (max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-moroccan-sand-50" aria-hidden="true" />
        )}
        {categoryName && (
          <Badge
            variant="featured"
            className="absolute top-2 start-2 text-[10px] font-semibold hidden sm:flex"
          >
            {categoryName}
          </Badge>
        )}
      </Link>

      <div className="p-3 sm:p-5 flex flex-col flex-1 gap-1 sm:gap-3 min-w-0">
        {/* Category shown inline on mobile (badge hidden on thumbnail) */}
        {categoryName && (
          <span className="sm:hidden text-[10px] font-semibold uppercase tracking-wide text-moroccan-red-500 truncate">
            {categoryName}
          </span>
        )}

        <Link href={`/blog/${post.slug}`} className="block min-w-0">
          <h3 className="font-display text-sm sm:text-lg font-bold text-foreground line-clamp-3 sm:line-clamp-2 group-hover:text-moroccan-red-500 transition-colors">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="hidden sm:block text-sm text-muted-foreground line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-auto pt-2 sm:pt-3 sm:border-t sm:border-border">
          <span className="truncate min-w-0">
            {post.published_at
              ? fmt.dateTime(new Date(post.published_at), { dateStyle: "medium" })
              : (post.author?.full_name ?? "—")}
          </span>
          <span className="inline-flex items-center gap-1 shrink-0">
            <Clock className="size-3" aria-hidden="true" />
            {t("card.readingTime", { minutes: post.reading_minutes })}
          </span>
          {post.comments_count > 0 && (
            <span className="inline-flex items-center gap-1 shrink-0">
              <MessageCircle className="size-3" aria-hidden="true" />
              {post.comments_count}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

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
        "group flex flex-col rounded-2xl border border-border bg-card shadow-card overflow-hidden hover:shadow-moroccan transition-shadow",
        className,
      )}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/10] bg-muted overflow-hidden"
      >
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-moroccan-sand-50" aria-hidden="true" />
        )}
        {categoryName && (
          <Badge
            variant="featured"
            className="absolute top-3 start-3 text-[10px] font-semibold"
          >
            {categoryName}
          </Badge>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <Link href={`/blog/${post.slug}`} className="block">
          <h3 className="font-display text-lg font-bold text-foreground line-clamp-2 group-hover:text-moroccan-red-500 transition-colors">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
          <span className="truncate">
            {post.author?.full_name ?? "—"}
            {post.published_at && (
              <>
                {" · "}
                {fmt.dateTime(new Date(post.published_at), { dateStyle: "medium" })}
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {t("card.readingTime", { minutes: post.reading_minutes })}
            </span>
            {post.comments_count > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3.5" aria-hidden="true" />
                {post.comments_count}
              </span>
            )}
          </span>
        </div>
      </div>
    </article>
  )
}

import Image from "next/image"
import { ArrowRight, ImageIcon, Newspaper } from "lucide-react"
import { getFormatter, getLocale, getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/ui/Container"
import { EmptyState } from "@/components/ui/EmptyState"
import { SectionTitle } from "@/components/ui/SectionTitle"
import { getLatestBlogPosts } from "@/lib/queries/home"

export async function BlogPreview() {
  const t = await getTranslations("home.blog")
  const locale = await getLocale()
  const format = await getFormatter()
  const posts = await getLatestBlogPosts(3)

  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
          <SectionTitle title={t("title")} subtitle={t("subtitle")} align="start" />
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-moroccan-red-500 hover:underline shrink-0"
          >
            {t("viewAll")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        {posts.length === 0 ? (
          <EmptyState icon={Newspaper} title={t("empty")} />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => {
              const categoryLabel = post.category
                ? locale === "ar"
                  ? post.category.name_ar
                  : post.category.name_fr
                : null
              const dateLabel = post.published_at
                ? format.dateTime(new Date(post.published_at), { dateStyle: "long" })
                : null

              return (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="relative aspect-[16/10] bg-moroccan-sand-50">
                      {post.cover_image ? (
                        <Image
                          src={post.cover_image}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-moroccan-sand-200">
                          <ImageIcon className="size-10" strokeWidth={1.2} />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col gap-2 flex-1">
                      {categoryLabel && (
                        <Badge variant="featured" className="w-fit">
                          {categoryLabel}
                        </Badge>
                      )}
                      <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-moroccan-red-500 transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      {dateLabel && (
                        <p className="mt-auto pt-3 text-xs text-muted-foreground">{dateLabel}</p>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Container>
    </section>
  )
}

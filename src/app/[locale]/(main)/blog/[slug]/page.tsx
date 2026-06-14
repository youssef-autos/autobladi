import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Calendar, Clock, Eye } from "lucide-react"
import {
  getFormatter,
  getLocale,
  getTranslations,
  setRequestLocale,
} from "next-intl/server"

import { BlogContent } from "@/components/blog/BlogContent"
import { BlogSidebar } from "@/components/blog/BlogSidebar"
import { BlogViewTracker } from "@/components/blog/BlogViewTracker"
import { CommentsList } from "@/components/blog/CommentsList"
import { RelatedPosts } from "@/components/blog/RelatedPosts"
import { ShareButtons } from "@/components/blog/ShareButtons"
import { JsonLd } from "@/components/seo/JsonLd"
import { articleSchema, breadcrumbSchema } from "@/lib/seo/structured-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/ui/Container"
import { MoroccanDivider } from "@/components/ui/MoroccanDivider"
import {
  getPostBySlug,
  getRelatedPosts,
  listApprovedComments,
} from "@/lib/queries/blog"
import { localeAlternates } from "@/lib/seo/alternates"

export const revalidate = 60

type RouteParams = { locale: string; slug: string }

function initials(name?: string | null): string {
  if (!name) return "A"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: "Not found" }
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: localeAlternates(locale, `/blog/${slug}`),
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      authors: post.author?.full_name ? [post.author.full_name] : undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const [t, fmt, locale_, comments, related] = await Promise.all([
    getTranslations("blog"),
    getFormatter(),
    getLocale(),
    listApprovedComments(post.id),
    getRelatedPosts(post.id, post.category?.id ?? null, 3),
  ])
  const categoryName =
    locale_ === "fr" ? post.category?.name_fr : post.category?.name_ar

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"
  const fullUrl = `${siteUrl}/${locale}/blog/${post.slug}`

  return (
    <>
      <BlogViewTracker postId={post.id} />

      {/* Cover header */}
      <header className="relative w-full h-[320px] md:h-[440px] overflow-hidden bg-brand-dark">
        {post.cover_image && (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
        {/* Darken only the lower half so the cover stays visible while the
            white title/meta remain readable over it. */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/55 to-brand-dark/5"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0">
          <Container className="pb-8 md:pb-12 text-white">
            {categoryName && (
              <Badge variant="featured" className="mb-3">
                {categoryName}
              </Badge>
            )}
            <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight max-w-3xl">
              {post.title}
            </h1>
            <div className="mt-4 flex items-center gap-4 text-sm text-white/80 flex-wrap">
              {post.author && (
                <span className="inline-flex items-center gap-2">
                  <Avatar className="size-7">
                    {post.author.avatar_url && (
                      <AvatarImage
                        src={post.author.avatar_url}
                        alt={post.author.full_name ?? ""}
                      />
                    )}
                    <AvatarFallback className="bg-white/15 text-white text-xs">
                      {initials(post.author.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.author.full_name ?? "—"}</span>
                </span>
              )}
              {post.published_at && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-4" aria-hidden="true" />
                  {fmt.dateTime(new Date(post.published_at), {
                    dateStyle: "long",
                  })}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" aria-hidden="true" />
                {t("detail.readingTime", { minutes: post.reading_minutes })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-4" aria-hidden="true" />
                {t("detail.viewsCount", { count: post.views_count })}
              </span>
            </div>
          </Container>
        </div>
      </header>

      <Container className="py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <article className="min-w-0">
            <BlogContent content={post.content} />

            {/* Tags + Share + Author bio */}
            <div className="max-w-[720px] mx-auto mt-10 space-y-8">
              {post.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {t("detail.tags")}:
                  </span>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center h-7 px-3 rounded-full bg-moroccan-sand-50 text-xs text-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <ShareButtons url={fullUrl} title={post.title} />

              <MoroccanDivider />

              <CommentsList
                postId={post.id}
                postSlug={post.slug}
                comments={comments}
              />
            </div>
          </article>

          <BlogSidebar />
        </div>
      </Container>

      <RelatedPosts posts={related} />

      <JsonLd
        data={articleSchema({
          locale,
          slug: post.slug,
          title: post.title,
          description: post.excerpt,
          imageUrl: post.cover_image,
          authorName: post.author?.full_name ?? null,
          publishedAt: post.published_at,
          updatedAt: post.published_at,
        })}
      />

      <JsonLd
        data={breadcrumbSchema([
          {
            name: locale === "fr" ? "Accueil" : "الرئيسية",
            url: `${siteUrl}/${locale}`,
          },
          {
            name: locale === "fr" ? "Blog" : "المدونة",
            url: `${siteUrl}/${locale}/blog`,
          },
          { name: post.title, url: fullUrl },
        ])}
      />
    </>
  )
}

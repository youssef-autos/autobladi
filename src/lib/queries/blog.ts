import "server-only"

import { getLocale } from "next-intl/server"

import { createClient } from "@/lib/supabase/server"
import { mediaHtml, mediaUrl } from "@/lib/media"
import type { Tables } from "@/types/database.types"

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------
export type BlogCategory = Tables<"blog_categories">

export type BlogAuthor = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export type BlogPostCard = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  published_at: string | null
  views_count: number
  comments_count: number
  reading_minutes: number
  tags: string[]
  category: { id: string; name_ar: string; name_fr: string; slug: string } | null
  author: BlogAuthor | null
}

export type BlogPostDetail = BlogPostCard & {
  content: string | null
}

export type BlogCategoryWithCount = BlogCategory & {
  posts_count: number
}

export type BlogComment = {
  id: string
  post_id: string
  parent_id: string | null
  content: string
  is_approved: boolean
  likes_count: number
  created_at: string
  user: BlogAuthor | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Rough word-count based reading time. 200 wpm is the conventional bookmark
 * for online articles (Medium uses the same number). We always return at
 * least 1 minute so the UI never shows "0 min".
 */
export function computeReadingMinutes(text: string | null | undefined): number {
  if (!text) return 1
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

type RawPostRow = Tables<"blog_posts"> & {
  blog_categories: Pick<
    Tables<"blog_categories">,
    "id" | "name_ar" | "name_fr" | "slug"
  > | null
  profiles: BlogAuthor | null
}

type PostLocale = "ar" | "fr"

/** Picks the French value when present (locale=fr), else the Arabic primary. */
function pick(
  locale: PostLocale,
  primary: string | null,
  fr: string | null,
): string | null {
  if (locale === "fr") return fr && fr.trim() ? fr : primary
  return primary
}

function localizedContent(row: RawPostRow, locale: PostLocale): string | null {
  // Rewrite inline `ads`-bucket image URLs so ad blockers don't strip them.
  return mediaHtml(pick(locale, row.content, row.content_fr))
}

function mapPostCard(row: RawPostRow, locale: PostLocale): BlogPostCard {
  const excerpt = pick(locale, row.excerpt, row.excerpt_fr)
  return {
    id: row.id,
    title: pick(locale, row.title, row.title_fr) ?? row.title,
    slug: row.slug,
    excerpt,
    cover_image: mediaUrl(row.cover_image),
    published_at: row.published_at,
    views_count: row.views_count,
    comments_count: row.comments_count,
    reading_minutes: computeReadingMinutes(localizedContent(row, locale) ?? excerpt),
    tags: row.tags ?? [],
    category: row.blog_categories,
    author: row.profiles,
  }
}

const cardSelect = `
  id, title, slug, excerpt, cover_image, published_at,
  views_count, comments_count, content, tags,
  title_fr, excerpt_fr, content_fr,
  blog_categories(id, name_ar, name_fr, slug),
  profiles(id, full_name, avatar_url)
` as const

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------
export type BlogListFilters = {
  page?: number
  pageSize?: number
  categorySlug?: string | null
  q?: string | null
}

export type BlogListResult = {
  posts: BlogPostCard[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function listPosts(
  filters: BlogListFilters = {},
): Promise<BlogListResult> {
  const supabase = await createClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = filters.pageSize ?? 12
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("blog_posts")
    .select(cardSelect, { count: "exact" })
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to)

  if (filters.categorySlug) {
    const { data: cat } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle<{ id: string }>()
    if (cat) {
      query = query.eq("category_id", cat.id)
    } else {
      return { posts: [], total: 0, page, pageSize, totalPages: 0 }
    }
  }

  if (filters.q) {
    // ILIKE on both languages' title + excerpt + content. Postgres' "or"
    // combinator joins them with OR — broad but cheap for blog volumes.
    const pattern = `%${filters.q.replace(/[%_]/g, "")}%`
    query = query.or(
      `title.ilike.${pattern},excerpt.ilike.${pattern},content.ilike.${pattern},` +
        `title_fr.ilike.${pattern},excerpt_fr.ilike.${pattern},content_fr.ilike.${pattern}`,
    )
  }

  const locale = (await getLocale()) as PostLocale
  const { data, count } = await query
  const rows = (data ?? []) as unknown as RawPostRow[]
  const total = count ?? 0
  return {
    posts: rows.map((r) => mapPostCard(r, locale)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

// ---------------------------------------------------------------------------
// Featured (latest published, used as the hero on /blog)
// ---------------------------------------------------------------------------
export async function getFeaturedPost(): Promise<BlogPostCard | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select(cardSelect)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const locale = (await getLocale()) as PostLocale
  return mapPostCard(data as unknown as RawPostRow, locale)
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------
export async function getPostBySlug(
  slug: string,
): Promise<BlogPostDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select(cardSelect)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()
  if (!data) return null
  const locale = (await getLocale()) as PostLocale
  const row = data as unknown as RawPostRow
  return { ...mapPostCard(row, locale), content: localizedContent(row, locale) }
}

// ---------------------------------------------------------------------------
// Related (same category, excluding current)
// ---------------------------------------------------------------------------
export async function getRelatedPosts(
  postId: string,
  categoryId: string | null,
  limit = 3,
): Promise<BlogPostCard[]> {
  const supabase = await createClient()
  let query = supabase
    .from("blog_posts")
    .select(cardSelect)
    .eq("is_published", true)
    .neq("id", postId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)
  if (categoryId) query = query.eq("category_id", categoryId)
  const locale = (await getLocale()) as PostLocale
  const { data } = await query
  const rows = (data ?? []) as unknown as RawPostRow[]
  return rows.map((r) => mapPostCard(r, locale))
}

// ---------------------------------------------------------------------------
// Sidebar helpers
// ---------------------------------------------------------------------------
export async function listLatestPosts(limit = 5): Promise<BlogPostCard[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select(cardSelect)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)
  const locale = (await getLocale()) as PostLocale
  const rows = (data ?? []) as unknown as RawPostRow[]
  return rows.map((r) => mapPostCard(r, locale))
}

export async function listCategoriesWithCounts(): Promise<
  BlogCategoryWithCount[]
> {
  const supabase = await createClient()
  const { data: cats } = await supabase
    .from("blog_categories")
    .select("*")
    .order("order_index", { ascending: true })
  if (!cats || cats.length === 0) return []

  // Compact aggregate: get all published posts' category_id then count
  // locally. Avoids needing a server-side group-by RPC for a small blog.
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("category_id")
    .eq("is_published", true)
  const counts = new Map<string, number>()
  for (const row of (posts ?? []) as Array<{ category_id: string | null }>) {
    if (!row.category_id) continue
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1)
  }

  return (cats as BlogCategory[]).map((c) => ({
    ...c,
    posts_count: counts.get(c.id) ?? 0,
  }))
}

export async function getCategoryBySlug(
  slug: string,
): Promise<BlogCategory | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<BlogCategory>()
  return data
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------
type RawComment = Tables<"blog_comments"> & {
  profiles: BlogAuthor | null
}

export async function listApprovedComments(
  postId: string,
): Promise<BlogComment[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_comments")
    .select(
      `id, post_id, parent_id, content, is_approved, likes_count, created_at,
       profiles(id, full_name, avatar_url)`,
    )
    .eq("post_id", postId)
    .eq("is_approved", true)
    .order("created_at", { ascending: true })
  const rows = (data ?? []) as unknown as RawComment[]
  return rows.map((r) => ({
    id: r.id,
    post_id: r.post_id,
    parent_id: r.parent_id,
    content: r.content,
    is_approved: r.is_approved,
    likes_count: r.likes_count,
    created_at: r.created_at,
    user: r.profiles,
  }))
}

// ---------------------------------------------------------------------------
// RSS feed source
// ---------------------------------------------------------------------------
type RssItem = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  published_at: string | null
  cover_image: string | null
  author_name: string | null
}

export async function listPostsForRss(limit = 20): Promise<RssItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select(
      `id, title, slug, excerpt, published_at, cover_image,
       profiles(full_name)`,
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)
  type RawRss = Pick<
    Tables<"blog_posts">,
    "id" | "title" | "slug" | "excerpt" | "published_at" | "cover_image"
  > & {
    profiles: { full_name: string | null } | null
  }
  return ((data ?? []) as unknown as RawRss[]).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    published_at: r.published_at,
    cover_image: r.cover_image,
    author_name: r.profiles?.full_name ?? null,
  }))
}

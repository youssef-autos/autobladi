import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"

// ---------------------------------------------------------------------------
// Blog categories — admin CRUD (post counts include drafts)
// ---------------------------------------------------------------------------
export type AdminBlogCategoryRow = Tables<"blog_categories"> & {
  posts_count: number
}

export async function listBlogCategoriesAdmin(): Promise<AdminBlogCategoryRow[]> {
  const supabase = await createClient()
  const { data: cats } = await supabase
    .from("blog_categories")
    .select("*")
    .order("order_index", { ascending: true })
  if (!cats || cats.length === 0) return []

  // Count ALL posts per category (published + drafts) — local aggregate.
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("category_id")
  const counts = new Map<string, number>()
  for (const row of (posts ?? []) as Array<{ category_id: string | null }>) {
    if (!row.category_id) continue
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1)
  }

  return (cats as Tables<"blog_categories">[]).map((c) => ({
    ...c,
    posts_count: counts.get(c.id) ?? 0,
  }))
}

// ---------------------------------------------------------------------------
// Blog posts — admin CRUD (lists drafts + published)
// ---------------------------------------------------------------------------
export type AdminBlogPostRow = {
  id: string
  title: string
  slug: string
  is_published: boolean
  published_at: string | null
  views_count: number
  comments_count: number
  cover_image: string | null
  created_at: string
  category: { id: string; name_ar: string; name_fr: string } | null
  author: { id: string; full_name: string | null } | null
}

type RawAdminPostRow = Tables<"blog_posts"> & {
  blog_categories: { id: string; name_ar: string; name_fr: string } | null
  profiles: { id: string; full_name: string | null } | null
}

export async function listBlogPostsAdmin(): Promise<AdminBlogPostRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id, title, slug, is_published, published_at, views_count,
      comments_count, cover_image, created_at,
      blog_categories(id, name_ar, name_fr),
      profiles!author_id(id, full_name)
    `)
    .order("created_at", { ascending: false })
  if (error) console.error("[listBlogPostsAdmin]", error.message)
  const rows = (data ?? []) as unknown as RawAdminPostRow[]
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    is_published: r.is_published,
    published_at: r.published_at,
    views_count: r.views_count,
    comments_count: r.comments_count,
    cover_image: r.cover_image,
    created_at: r.created_at,
    category: r.blog_categories,
    author: r.profiles,
  }))
}

export type AdminBlogPostFull = Pick<
  Tables<"blog_posts">,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "meta_description"
  | "content"
  | "title_fr"
  | "excerpt_fr"
  | "meta_description_fr"
  | "content_fr"
  | "cover_image"
  | "category_id"
  | "tags"
  | "tags_fr"
  | "is_published"
>

export async function getBlogPostAdmin(
  id: string,
): Promise<AdminBlogPostFull | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, meta_description, content, title_fr, excerpt_fr, meta_description_fr, content_fr, cover_image, category_id, tags, tags_fr, is_published",
    )
    .eq("id", id)
    .maybeSingle()
  return (data as AdminBlogPostFull | null) ?? null
}

// ---------------------------------------------------------------------------
// Blog comments — moderation (approve / hide / delete)
// ---------------------------------------------------------------------------
export type AdminBlogCommentRow = {
  id: string
  content: string
  is_approved: boolean
  created_at: string
  is_reply: boolean
  post: { id: string; title: string; slug: string } | null
  author: { id: string; full_name: string | null; avatar_url: string | null } | null
}

type RawAdminCommentRow = Tables<"blog_comments"> & {
  blog_posts: { id: string; title: string; slug: string } | null
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export async function listBlogCommentsAdmin(): Promise<AdminBlogCommentRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_comments")
    .select(`
      id, content, is_approved, created_at, parent_id,
      blog_posts(id, title, slug),
      profiles!user_id(id, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
  if (error) console.error("[listBlogCommentsAdmin]", error.message)
  const rows = (data ?? []) as unknown as RawAdminCommentRow[]
  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    is_approved: r.is_approved,
    created_at: r.created_at,
    is_reply: r.parent_id != null,
    post: r.blog_posts,
    author: r.profiles,
  }))
}

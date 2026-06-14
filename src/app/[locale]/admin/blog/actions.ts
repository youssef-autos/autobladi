"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  blogPostSchema,
  blogPostUpdateSchema,
} from "@/lib/validations/blog-post"
import { pingIndexNow } from "@/lib/seo/indexnow"

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function ensureAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  if (profile?.account_type !== "admin") return null
  return { adminId: user.id }
}

function revalidate(slug?: string) {
  revalidatePath("/admin/blog")
  revalidatePath("/blog")
  if (slug) revalidatePath(`/blog/${slug}`)
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createBlogPost(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = blogPostSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }
  const v = parsed.data

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_posts")
    .insert({
      title: v.title,
      slug: v.slug,
      excerpt: v.excerpt,
      content: v.content,
      title_fr: v.title_fr,
      excerpt_fr: v.excerpt_fr,
      content_fr: v.content_fr,
      cover_image: v.cover_image,
      category_id: v.category_id,
      tags: v.tags,
      is_published: v.is_published,
      published_at: v.is_published ? new Date().toISOString() : null,
      author_id: ctx.adminId,
    } as never)
    .select("id")
    .single<{ id: string }>()
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  if (v.is_published) await pingIndexNow([`/blog/${v.slug}`])
  revalidate(v.slug)
  return { ok: true, data: { id: data.id } }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export async function updateBlogPost(input: unknown): Promise<ActionResult> {
  const parsed = blogPostUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }
  const { id, ...v } = parsed.data

  const admin = createAdminClient()

  // Preserve the original publish date; only stamp it the first time a post
  // goes live.
  const { data: current } = await admin
    .from("blog_posts")
    .select("published_at")
    .eq("id", id)
    .maybeSingle<{ published_at: string | null }>()
  const publishedAt =
    v.is_published && !current?.published_at
      ? new Date().toISOString()
      : (current?.published_at ?? null)

  const { error } = await admin
    .from("blog_posts")
    .update({
      title: v.title,
      slug: v.slug,
      excerpt: v.excerpt,
      content: v.content,
      title_fr: v.title_fr,
      excerpt_fr: v.excerpt_fr,
      content_fr: v.content_fr,
      cover_image: v.cover_image,
      category_id: v.category_id,
      tags: v.tags,
      is_published: v.is_published,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  if (v.is_published) await pingIndexNow([`/blog/${v.slug}`])
  revalidate(v.slug)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Toggle publish (from the list view)
// ---------------------------------------------------------------------------
const toggleSchema = z.object({ id: z.uuid(), publish: z.boolean() })

export async function toggleBlogPostPublish(
  input: unknown,
): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { data: current } = await admin
    .from("blog_posts")
    .select("published_at, slug")
    .eq("id", parsed.data.id)
    .maybeSingle<{ published_at: string | null; slug: string }>()

  const publishedAt =
    parsed.data.publish && !current?.published_at
      ? new Date().toISOString()
      : (current?.published_at ?? null)

  const { error } = await admin
    .from("blog_posts")
    .update({
      is_published: parsed.data.publish,
      published_at: publishedAt,
    } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }

  if (parsed.data.publish && current?.slug) {
    await pingIndexNow([`/blog/${current.slug}`])
  }
  revalidate(current?.slug)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export async function deleteBlogPost(id: unknown): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  // blog_comments cascade on delete (FK ON DELETE CASCADE).
  const { error } = await admin
    .from("blog_posts")
    .delete()
    .eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

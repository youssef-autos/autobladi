"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { blogCommentSchema, type BlogCommentValues } from "@/lib/validations/blog"

export type CommentResult =
  | { ok: true }
  | {
      ok: false
      error: "validation" | "not_authenticated" | "server_error"
      message?: string
    }

/**
 * Posts a comment as the currently signed-in user. Always created with
 * `is_approved = false` — admins approve from /admin/blog/comments. We
 * intentionally don't return the created row; the UI shows a "pending
 * review" toast instead.
 */
export async function submitBlogComment(
  input: BlogCommentValues,
  /** Slug used only for revalidating the post page once approved. */
  postSlug?: string,
): Promise<CommentResult> {
  const parsed = blogCommentSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      message: parsed.error.issues[0]?.message,
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: "not_authenticated" }
  }

  const { postId, parentId, content } = parsed.data

  // If parentId is provided, make sure it actually belongs to the same post
  // — small defensive check so the client can't bind a reply to an
  // unrelated thread.
  if (parentId) {
    const { data: parent } = await supabase
      .from("blog_comments")
      .select("post_id")
      .eq("id", parentId)
      .maybeSingle<{ post_id: string }>()
    if (!parent || parent.post_id !== postId) {
      return { ok: false, error: "validation", message: "bad_parent" }
    }
  }

  const { error } = await supabase.from("blog_comments").insert({
    post_id: postId,
    user_id: user.id,
    parent_id: parentId ?? null,
    content,
    is_approved: false,
  } as never)

  if (error) {
    return { ok: false, error: "server_error", message: error.message }
  }

  if (postSlug) {
    // No-op on dynamic routes, but harmless. Helps if we ever start
    // caching the detail page.
    revalidatePath(`/[locale]/blog/${postSlug}`, "page")
  }

  return { ok: true }
}

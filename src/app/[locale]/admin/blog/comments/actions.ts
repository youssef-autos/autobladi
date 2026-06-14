"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type ActionResult = { ok: true } | { ok: false; error: string }

async function adminClient() {
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
  return { supabase, adminId: user.id }
}

function revalidate() {
  revalidatePath("/admin/blog/comments")
  revalidatePath("/blog")
  revalidatePath("/admin")
}

const idSchema = z.uuid()
const setApprovalSchema = z.object({ id: z.uuid(), approved: z.boolean() })

// Approve or hide a comment. The migration-009 trigger recomputes the
// post's comments_count whenever is_approved changes.
export async function setCommentApproval(input: unknown): Promise<ActionResult> {
  const parsed = setApprovalSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error } = await ctx.supabase
    .from("blog_comments")
    .update({ is_approved: parsed.data.approved } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

// Permanently delete a comment (cascades to its replies via parent_id).
export async function deleteComment(input: unknown): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error } = await ctx.supabase
    .from("blog_comments")
    .delete()
    .eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

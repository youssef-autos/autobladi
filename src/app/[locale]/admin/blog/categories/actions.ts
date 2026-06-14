"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  blogCategorySchema,
  blogCategoryUpdateSchema,
} from "@/lib/validations/blog-category"

export type ActionResult = { ok: true } | { ok: false; error: string }

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
  return { supabase, adminId: user.id }
}

function revalidate() {
  revalidatePath("/admin/blog/categories")
  revalidatePath("/blog")
}

export async function createBlogCategory(input: unknown): Promise<ActionResult> {
  const parsed = blogCategorySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("blog_categories").insert(parsed.data as never)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  revalidate()
  return { ok: true }
}

export async function updateBlogCategory(input: unknown): Promise<ActionResult> {
  const parsed = blogCategoryUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const { id, ...rest } = parsed.data
  const admin = createAdminClient()
  const { error } = await admin
    .from("blog_categories")
    .update(rest as never)
    .eq("id", id)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  revalidate()
  return { ok: true }
}

export async function deleteBlogCategory(id: unknown): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  // blog_posts.category_id is ON DELETE SET NULL — posts keep existing,
  // they simply lose their category. No 23503 expected.
  const { error } = await admin
    .from("blog_categories")
    .delete()
    .eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

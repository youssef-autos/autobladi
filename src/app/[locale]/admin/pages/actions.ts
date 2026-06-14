"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { pageSchema, pageUpdateSchema } from "@/lib/validations/page"

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
  revalidatePath("/admin/pages")
  revalidatePath("/", "layout") // footer links live in the root layout
  if (slug) revalidatePath(`/p/${slug}`)
}

export async function createPage(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = pageSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("pages")
    .insert(parsed.data as never)
    .select("id")
    .single<{ id: string }>()
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  revalidate(parsed.data.slug)
  return { ok: true, data: { id: data.id } }
}

export async function updatePage(input: unknown): Promise<ActionResult> {
  const parsed = pageUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { id, ...rest } = parsed.data
  const admin = createAdminClient()
  const { error } = await admin
    .from("pages")
    .update({ ...rest, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  revalidate(parsed.data.slug)
  return { ok: true }
}

const toggleSchema = z.object({ id: z.uuid(), publish: z.boolean() })

export async function togglePagePublish(input: unknown): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("pages")
    .update({ is_published: parsed.data.publish } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }
  revalidate()
  return { ok: true }
}

export async function deletePage(id: unknown): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("pages").delete().eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }
  revalidate()
  return { ok: true }
}

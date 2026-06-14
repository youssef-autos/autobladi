"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  secteurSchema,
  secteurUpdateSchema,
} from "@/lib/validations/secteur"

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
  return true
}

export async function createSecteur(input: unknown): Promise<ActionResult> {
  const parsed = secteurSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("secteurs").insert(parsed.data as never)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  revalidatePath("/admin/cities")
  return { ok: true }
}

export async function updateSecteur(input: unknown): Promise<ActionResult> {
  const parsed = secteurUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation" }
  }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const { id, ...rest } = parsed.data
  const admin = createAdminClient()
  const { error } = await admin
    .from("secteurs")
    .update(rest as never)
    .eq("id", id)
  if (error) {
    if (error.code === "23505") return { ok: false, error: "slug_taken" }
    return { ok: false, error: error.message }
  }
  revalidatePath("/admin/cities")
  return { ok: true }
}

export async function deleteSecteur(id: unknown): Promise<ActionResult> {
  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const admin = createAdminClient()
  const { error } = await admin.from("secteurs").delete().eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/cities")
  return { ok: true }
}

/** Load secteurs for a city — called from client via server action. */
export async function fetchSecteursForCity(
  cityId: string,
): Promise<
  Array<{
    id: string
    city_id: string
    name_ar: string
    name_fr: string
    slug: string
    created_at: string
  }>
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("secteurs")
    .select("*")
    .eq("city_id", cityId)
    .order("name_fr", { ascending: true })
  return (data ?? []) as never
}

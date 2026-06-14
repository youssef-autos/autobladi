"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { HOME_SECTION_KEYS, mergeHomeSections } from "@/lib/home-sections"

export type SectionsResult = { ok: true } | { ok: false; error: string }

const schema = z.array(
  z.object({
    key: z.enum(HOME_SECTION_KEYS),
    visible: z.boolean(),
  }),
)

async function assertAdmin() {
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
  return supabase
}

export async function saveHomeSections(
  input: unknown,
): Promise<SectionsResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "validation" }

  const supabase = await assertAdmin()
  if (!supabase) return { ok: false, error: "forbidden" }

  // Normalise (dedupe + append any missing sections) before persisting.
  const value = mergeHomeSections(parsed.data)

  const { error } = await supabase
    .from("site_settings")
    .upsert([{ key: "home_sections", value }] as never, { onConflict: "key" })
  if (error) return { ok: false, error: error.message }

  revalidatePath("/", "layout")
  revalidatePath("/admin/sections")
  return { ok: true }
}

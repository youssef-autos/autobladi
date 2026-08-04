"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type ShowroomResult = { ok: true } | { ok: false; error: string }

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
  revalidatePath("/admin/showrooms")
  revalidatePath("/admin")
  revalidatePath("/showrooms")
}

const toggleSchema = z.object({ id: z.uuid(), is_active: z.boolean() })

export async function toggleShowroomActive(
  input: unknown,
): Promise<ShowroomResult> {
  const parsed = toggleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error } = await ctx.supabase
    .from("showrooms")
    .update({ is_active: parsed.data.is_active } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

const toggleVerifiedSchema = z.object({ id: z.uuid(), is_verified: z.boolean() })

export async function toggleShowroomVerified(
  input: unknown,
): Promise<ShowroomResult> {
  const parsed = toggleVerifiedSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error } = await ctx.supabase
    .from("showrooms")
    .update({ is_verified: parsed.data.is_verified } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

const idSchema = z.uuid()

export async function deleteShowroom(
  input: unknown,
): Promise<ShowroomResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error } = await ctx.supabase
    .from("showrooms")
    .delete()
    .eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

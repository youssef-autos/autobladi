"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type ContactResult = { ok: true } | { ok: false; error: string }

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

const markSchema = z.object({ id: z.uuid(), is_read: z.boolean() })

export async function markContactRead(input: unknown): Promise<ContactResult> {
  const parsed = markSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error } = await ctx.supabase
    .from("contact_messages")
    .update({ is_read: parsed.data.is_read } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/contact")
  revalidatePath("/admin")
  return { ok: true }
}

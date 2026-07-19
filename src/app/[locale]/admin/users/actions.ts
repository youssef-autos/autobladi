"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type UserActionResult = { ok: true } | { ok: false; error: string }

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

const idSchema = z.uuid()
const setRoleSchema = z.object({
  id: z.uuid(),
  role: z.enum(["gratuit", "pro", "admin"]),
})

export async function setUserRole(input: unknown): Promise<UserActionResult> {
  const parsed = setRoleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  // Promotion to admin is not exposed; this endpoint only de-escalates.
  if (parsed.data.role === "admin") return { ok: false, error: "admin_not_allowed" }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }
  if (parsed.data.id === ctx.adminId) return { ok: false, error: "cant_self" }

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ account_type: parsed.data.role } as never)
    .eq("id", parsed.data.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/users")
  return { ok: true }
}

const nullableTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null))

const updateProfileSchema = z.object({
  id: z.uuid(),
  full_name: nullableTrimmed(120),
  phone: nullableTrimmed(40),
  whatsapp: nullableTrimmed(40),
  city: nullableTrimmed(80),
  account_type: z.enum(["gratuit", "pro", "admin"]),
})

// Edit a user's profile (name, contact, city, type).
export async function updateUserProfile(
  input: unknown,
): Promise<UserActionResult> {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }
  const v = parsed.data

  // An admin can't strip their own admin role here.
  if (v.id === ctx.adminId && v.account_type !== "admin") {
    return { ok: false, error: "cant_self" }
  }

  // Promotion to admin is not offered from this screen. Only allow the
  // "admin" value if the target is already an admin (keeps them admin).
  if (v.account_type === "admin") {
    const { data: current } = await ctx.supabase
      .from("profiles")
      .select("account_type")
      .eq("id", v.id)
      .maybeSingle<{ account_type: string }>()
    if (current?.account_type !== "admin") {
      return { ok: false, error: "admin_not_allowed" }
    }
  }

  const { error } = await ctx.supabase
    .from("profiles")
    .update({
      full_name: v.full_name,
      phone: v.phone,
      whatsapp: v.whatsapp,
      city: v.city,
      account_type: v.account_type,
    } as never)
    .eq("id", v.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/users")
  return { ok: true }
}

export async function deleteUser(input: unknown): Promise<UserActionResult> {
  const parsed = z.object({ id: idSchema }).safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await ensureAdmin()
  if (!ctx) return { ok: false, error: "forbidden" }
  if (parsed.data.id === ctx.adminId) return { ok: false, error: "cant_self" }

  // Must use admin client (service role) to delete from auth.users.
  const { createAdminClient } = await import("@/lib/supabase/admin")
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.auth.admin.deleteUser(parsed.data.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/users")
  return { ok: true }
}

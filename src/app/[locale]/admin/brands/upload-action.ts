"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
const MAX_BYTES = 2 * 1024 * 1024

async function ensureAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  return data?.account_type === "admin"
}

export async function uploadBrandLogo(formData: FormData): Promise<UploadResult> {
  if (!(await ensureAdmin())) return { ok: false, error: "forbidden" }

  const file = formData.get("file") as File | null
  if (!file) return { ok: false, error: "no_file" }
  if (!ALLOWED_TYPES.includes(file.type))
    return { ok: false, error: `Type non supporté: ${file.type}. Utilisez JPG, PNG ou WebP.` }
  if (file.size > MAX_BYTES)
    return { ok: false, error: "Taille max 2 MB." }

  const admin = createAdminClient()
  const buffer = await file.arrayBuffer()
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png"
  const path = `brands/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await admin.storage
    .from("ads")
    .upload(path, buffer, { contentType: file.type, upsert: false })
  if (error) return { ok: false, error: error.message }

  const { data: { publicUrl } } = admin.storage.from("ads").getPublicUrl(path)
  return { ok: true, url: publicUrl }
}

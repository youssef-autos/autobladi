import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export const ANNONCES_BUCKET = "annonces"

export type UploadedAsset = {
  path: string
  publicUrl: string
}

/**
 * Uploads a buffer to the annonces bucket and returns the public URL.
 * Uses the service-role admin client to bypass per-user RLS issues — the
 * caller is responsible for authorizing the upload (e.g. via auth.getUser()).
 */
export async function uploadToAnnoncesBucket(
  path: string,
  body: Buffer,
  contentType: string,
): Promise<UploadedAsset> {
  const admin = createAdminClient()
  const { error } = await admin.storage.from(ANNONCES_BUCKET).upload(path, body, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  })
  if (error) {
    throw new Error(`Upload failed for ${path}: ${error.message}`)
  }
  const { data } = admin.storage.from(ANNONCES_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

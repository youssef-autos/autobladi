import { createClient } from "@/lib/supabase/client"

export type PrivateUploadResult = {
  /** Storage path (e.g. "<userId>/rc-1234.pdf"). NOT a public URL. */
  path: string
  /** Original file name, useful for UI display only. */
  filename: string
  /** Content type as reported by the browser. */
  contentType: string
}

/**
 * Uploads a file to a Supabase Storage bucket whose RLS allows the
 * authenticated user to write into their own folder (`<uid>/...`).
 * The returned path is stored verbatim in the DB — admins generate
 * signed URLs on-demand to preview the document.
 */
export async function uploadToPrivateBucket(
  bucket: string,
  file: File,
  options: { userId: string; prefix: string },
): Promise<PrivateUploadResult> {
  const supabase = createClient()
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
  const path = `${options.userId}/${options.prefix}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
    cacheControl: "3600",
  })
  if (error) throw error

  return { path, filename: file.name, contentType: file.type }
}

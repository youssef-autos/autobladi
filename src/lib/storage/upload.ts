/**
 * Client-side helper to upload an image to the watermark pipeline.
 * Calls /api/watermark, which:
 *   - applies the diagonal watermark via Sharp
 *   - resizes to 1200×900 (main) and 400×300 (thumb), WebP
 *   - uploads both to Supabase Storage in the user's folder
 * Returns the public URLs of the processed assets.
 */
export type UploadResult = {
  mainUrl: string
  thumbnailUrl: string
}

export async function uploadWithWatermark(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("/api/watermark", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const detail = data?.error ?? `HTTP ${res.status}`
    throw new Error(`Upload failed: ${detail}`)
  }

  return res.json() as Promise<UploadResult>
}

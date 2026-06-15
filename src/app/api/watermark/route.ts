import { randomUUID } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { uploadToAnnoncesBucket } from "@/lib/storage/server"

// sharp (native module) is not available in Cloudflare Workers.
// Images are uploaded as-is without server-side resize or watermark.
// Watermark can be handled client-side before upload if needed.
export const runtime = "nodejs"
export const maxDuration = 30

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])

function extFromType(type: string): string {
  if (type === "image/webp") return "webp"
  if (type === "image/png") return "png"
  return "jpg"
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 })
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Unsupported type" }, { status: 415 })

  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch (err) {
    console.error("watermark: read failed", err)
    return NextResponse.json({ error: "Read failed" }, { status: 500 })
  }

  const id = randomUUID()
  const ext = extFromType(file.type)
  const mainPath = `${user.id}/${id}.${ext}`
  const thumbPath = `${user.id}/${id}_thumb.${ext}`

  try {
    const [main, thumb] = await Promise.all([
      uploadToAnnoncesBucket(mainPath, buffer, file.type),
      uploadToAnnoncesBucket(thumbPath, buffer, file.type),
    ])
    return NextResponse.json({ mainUrl: main.publicUrl, thumbnailUrl: thumb.publicUrl })
  } catch (err) {
    console.error("watermark: upload failed", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

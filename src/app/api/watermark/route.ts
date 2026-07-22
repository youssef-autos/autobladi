import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { NextResponse, type NextRequest } from "next/server"
import sharp from "sharp"

import { createClient } from "@/lib/supabase/server"
import { uploadToAnnoncesBucket } from "@/lib/storage/server"
import { checkRateLimit } from "@/lib/ai/rate-limit"

export const runtime = "nodejs"
export const maxDuration = 30

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])

const MAIN = { width: 1200, height: 900 }
const THUMB = { width: 400, height: 300 }

/** Accepts either a plain JSON string ("autobladi.ma") or {text: "..."}. */
function extractWatermarkText(raw: unknown): string {
  if (typeof raw === "string" && raw.length > 0) return raw
  if (raw && typeof raw === "object" && "text" in raw) {
    const t = (raw as { text: unknown }).text
    if (typeof t === "string" && t.length > 0) return t
  }
  return "autobladi.ma"
}

async function getWatermarkText(): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "watermark_text")
    .maybeSingle<{ value: unknown }>()
  return extractWatermarkText(data?.value)
}

function escapeForSvg(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// Serverless hosts (Vercel/Lambda) ship almost no fonts, so `system-ui`/`Arial`
// referenced by the SVG resolve to nothing and the watermark text renders
// broken or invisible. Embedding a bundled font as a base64 @font-face makes
// rendering deterministic on any environment. Read once, then cache.
const WM_FONT_FAMILY = "AutobladiWM"
let cachedFontFace: string | null = null

function fontFaceStyle(): string {
  if (cachedFontFace !== null) return cachedFontFace
  try {
    const fontPath = join(process.cwd(), "src", "assets", "watermark-font.ttf")
    const b64 = readFileSync(fontPath).toString("base64")
    cachedFontFace = `@font-face{font-family:"${WM_FONT_FAMILY}";src:url(data:font/ttf;base64,${b64}) format("truetype");}`
  } catch (err) {
    // Fall back to system fonts (works on dev machines that have them).
    console.error("[watermark] embedded font unavailable:", err)
    cachedFontFace = ""
  }
  return cachedFontFace
}

/**
 * Single centered watermark, avito.ma-style: one large bold line of brand
 * text across the middle of the image at moderate opacity — not a tiled,
 * rotated repeat. A soft dark stroke keeps it legible over both light and
 * dark parts of the photo.
 */
function buildWatermarkSvg({
  text,
  width,
  height,
}: {
  text: string
  width: number
  height: number
}): Buffer {
  const safe = escapeForSvg(text.toUpperCase())
  const face = fontFaceStyle()
  const fontFamily = face ? WM_FONT_FAMILY : "system-ui, Arial, sans-serif"

  // Size the text to span ~70% of the image width regardless of length,
  // within sane bounds so very short/long watermark text still looks right.
  const targetWidth = width * 0.7
  const estCharWidth = 0.58
  const fontSize = Math.min(
    height * 0.22,
    Math.max(height * 0.06, targetWidth / (safe.length * estCharWidth)),
  )

  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${face ? `<style>${face}</style>` : ""}
    </defs>
    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      font-family="${fontFamily}"
      font-size="${fontSize.toFixed(1)}"
      font-weight="bold"
      letter-spacing="${(fontSize * 0.04).toFixed(1)}"
      fill="white"
      fill-opacity="0.45"
      stroke="black"
      stroke-opacity="0.15"
      stroke-width="1"
    >${safe}</text>
  </svg>`)
}

async function processImage(buffer: ArrayBuffer, watermark: string) {
  const input = Buffer.from(buffer)

  const mainOverlay = buildWatermarkSvg({
    text: watermark,
    width: MAIN.width,
    height: MAIN.height,
  })

  const main = await sharp(input)
    .rotate()
    .resize(MAIN.width, MAIN.height, { fit: "cover", position: "center" })
    .composite([{ input: mainOverlay, blend: "over" }])
    .webp({ quality: 85 })
    .toBuffer()

  const thumbOverlay = buildWatermarkSvg({
    text: watermark,
    width: THUMB.width,
    height: THUMB.height,
  })

  const thumb = await sharp(input)
    .rotate()
    .resize(THUMB.width, THUMB.height, { fit: "cover", position: "center" })
    .composite([{ input: thumbOverlay, blend: "over" }])
    .webp({ quality: 80 })
    .toBuffer()

  return { main, thumb }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 20 uploads per hour per user (image processing is CPU-intensive).
  const rl = checkRateLimit(`watermark:${user.id}`, 20, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    )
  }

  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported type" }, { status: 415 })
  }

  let processed
  try {
    const buffer = await file.arrayBuffer()
    const watermark = await getWatermarkText()
    processed = await processImage(buffer, watermark)
  } catch (err) {
    console.error("watermark processing failed", err)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }

  const id = randomUUID()
  const mainPath = `${user.id}/${id}.webp`
  const thumbPath = `${user.id}/${id}_thumb.webp`

  try {
    const [main, thumb] = await Promise.all([
      uploadToAnnoncesBucket(mainPath, processed.main, "image/webp"),
      uploadToAnnoncesBucket(thumbPath, processed.thumb, "image/webp"),
    ])
    return NextResponse.json({
      mainUrl: main.publicUrl,
      thumbnailUrl: thumb.publicUrl,
    })
  } catch (err) {
    console.error("storage upload failed", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

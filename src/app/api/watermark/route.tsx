import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { NextResponse, type NextRequest } from "next/server"
import { ImageResponse } from "next/og"
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

// Fixed brand watermark — not admin-configurable. "AUTOBLADI" renders large,
// ".MA" smaller and baseline-aligned to its bottom-right, like a wordmark
// with a trademark-style extension.
const WORD = "AUTOBLADI"
const EXT = ".MA"

// Serverless hosts (Vercel/Lambda) ship almost no fonts, and sharp's SVG
// compositing (librsvg) does not reliably honor a CSS @font-face embedded as
// a base64 data URI — it silently falls back to missing-glyph "tofu" boxes
// there, even though it looks fine on a dev machine with system font
// fallbacks to mask the failure. `next/og`'s ImageResponse (Satori) embeds
// the provided font buffer directly for text shaping/rendering, independent
// of the OS font stack, so it's used here instead — the overlay is rendered
// to a transparent PNG, then composited with sharp exactly as the old SVG
// buffer was. Read the font file once, then cache the buffer.
let cachedFont: Buffer | null = null

function loadFont(): Buffer | null {
  if (cachedFont !== null) return cachedFont
  try {
    const fontPath = join(process.cwd(), "src", "assets", "watermark-font.ttf")
    cachedFont = readFileSync(fontPath)
  } catch (err) {
    console.error("[watermark] embedded font unavailable:", err)
    cachedFont = Buffer.alloc(0)
  }
  return cachedFont.length > 0 ? cachedFont : null
}

/**
 * Single centered watermark: a discreet "AUTOBLADI.MA" logotype across the
 * middle of the image — not a tiled, rotated repeat. "AUTOBLADI" renders
 * large, ".MA" smaller and sharing its baseline (bottom-right of the word).
 * A soft, low-contrast text-shadow keeps it faintly readable over both
 * light and dark parts of the photo while staying blended into the paint.
 */
async function buildWatermarkOverlay({
  width,
  height,
}: {
  width: number
  height: number
}): Promise<Buffer> {
  // Size the text to span ~35% of the image width, within sane bounds.
  const targetWidth = width * 0.35
  const estCharWidth = 0.6
  const fontSize = Math.min(
    height * 0.11,
    Math.max(height * 0.035, targetWidth / (WORD.length * estCharWidth)),
  )
  const extFontSize = fontSize * 0.45
  const shadow = Math.max(1, fontSize * 0.035)
  const shadowColor = "rgba(0,0,0,0.18)"
  const textColor = "rgba(255,255,255,0.2)"
  const textShadow = [
    `${shadow}px ${shadow}px 0 ${shadowColor}`,
    `-${shadow}px -${shadow}px 0 ${shadowColor}`,
    `${shadow}px -${shadow}px 0 ${shadowColor}`,
    `-${shadow}px ${shadow}px 0 ${shadowColor}`,
  ].join(", ")

  const font = loadFont()
  const fontFamily = font ? "AutobladiWM" : "sans-serif"

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div
            style={{
              fontSize,
              fontWeight: 700,
              fontFamily,
              textTransform: "uppercase",
              letterSpacing: fontSize * 0.04,
              color: textColor,
              textShadow,
            }}
          >
            {WORD}
          </div>
          <div
            style={{
              fontSize: extFontSize,
              fontWeight: 700,
              fontFamily,
              textTransform: "uppercase",
              marginLeft: fontSize * 0.05,
              color: textColor,
              textShadow,
            }}
          >
            {EXT}
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: font
        ? [{ name: "AutobladiWM", data: font, weight: 700, style: "normal" }]
        : undefined,
    },
  )

  return Buffer.from(await image.arrayBuffer())
}

async function processImage(buffer: ArrayBuffer) {
  const input = Buffer.from(buffer)

  const [mainOverlay, thumbOverlay] = await Promise.all([
    buildWatermarkOverlay({ width: MAIN.width, height: MAIN.height }),
    buildWatermarkOverlay({ width: THUMB.width, height: THUMB.height }),
  ])

  const [main, thumb] = await Promise.all([
    sharp(input)
      .rotate()
      .resize(MAIN.width, MAIN.height, { fit: "cover", position: "center" })
      .composite([{ input: mainOverlay, blend: "over" }])
      .webp({ quality: 85 })
      .toBuffer(),
    sharp(input)
      .rotate()
      .resize(THUMB.width, THUMB.height, { fit: "cover", position: "center" })
      .composite([{ input: thumbOverlay, blend: "over" }])
      .webp({ quality: 80 })
      .toBuffer(),
  ])

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
    processed = await processImage(buffer)
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

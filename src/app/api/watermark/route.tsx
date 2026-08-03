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

/** Accepts either a plain JSON string ("AutoBladi.ma") or {text: "..."}. */
function extractWatermarkText(raw: unknown): string {
  if (typeof raw === "string" && raw.length > 0) return raw
  if (raw && typeof raw === "object" && "text" in raw) {
    const t = (raw as { text: unknown }).text
    if (typeof t === "string" && t.length > 0) return t
  }
  return "AutoBladi.ma"
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
 * Tiled, rotated watermark repeat, avito.ma-style: small brand text at
 * regular intervals across a diagonal grid, instead of one large centered
 * line. The grid is rendered oversized and rotated, then clipped to the
 * image bounds, so tiles still cover every corner post-rotation.
 */
async function buildWatermarkOverlay({
  text,
  width,
  height,
}: {
  text: string
  width: number
  height: number
}): Promise<Buffer> {
  const label = text
  const font = loadFont()

  const angle = -22
  const fontSize = Math.max(14, height * 0.035)
  const padX = fontSize * 1.6
  const padY = fontSize * 1.3
  const cellW = fontSize * label.length * 0.62 + padX * 2
  const rowH = fontSize + padY * 2
  const shadow = Math.max(1, fontSize * 0.05)

  // Oversize the rotated grid so its corners still cover the image after
  // rotation, then clip to the real bounds with overflow: hidden.
  const innerW = width * 1.6
  const innerH = height * 1.6
  const cols = Math.ceil(innerW / cellW) + 1
  const rows = Math.ceil(innerH / rowH) + 1

  const tileStyle = {
    display: "flex" as const,
    width: cellW,
    justifyContent: "center" as const,
    padding: `${padY}px ${padX}px`,
    fontSize,
    fontWeight: 700,
    fontFamily: font ? "AutobladiWM" : "sans-serif",
    color: "rgba(255,255,255,0.45)",
    whiteSpace: "nowrap" as const,
    textShadow: [
      `${shadow}px ${shadow}px 0 rgba(0,0,0,0.28)`,
      `-${shadow}px -${shadow}px 0 rgba(0,0,0,0.28)`,
      `${shadow}px -${shadow}px 0 rgba(0,0,0,0.28)`,
      `-${shadow}px ${shadow}px 0 rgba(0,0,0,0.28)`,
    ].join(", "),
  }

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: innerW,
            height: innerH,
            display: "flex",
            flexWrap: "wrap",
            alignContent: "center",
            justifyContent: "center",
            transform: `rotate(${angle}deg)`,
          }}
        >
          {Array.from({ length: cols * rows }).map((_, i) => (
            <div key={i} style={tileStyle}>
              {label}
            </div>
          ))}
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

async function processImage(buffer: ArrayBuffer, watermark: string) {
  const input = Buffer.from(buffer)

  const [mainOverlay, thumbOverlay] = await Promise.all([
    buildWatermarkOverlay({ text: watermark, width: MAIN.width, height: MAIN.height }),
    buildWatermarkOverlay({ text: watermark, width: THUMB.width, height: THUMB.height }),
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

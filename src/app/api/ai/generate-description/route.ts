import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { generateDescription } from "@/lib/ai/provider"
import { checkRateLimit } from "@/lib/ai/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 30

const schema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  mileage: z.number().int().nonnegative().nullable().optional(),
  fuelType: z.string().min(1).nullable(),
  transmission: z.string().min(1).nullable(),
  options: z.array(z.string()),
  firstOwner: z.boolean(),
  accidentFree: z.boolean(),
  condition: z.enum(["neuf", "occasion"]),
  language: z.enum(["ar", "fr"]),
})

// 10 generations / hour per user
const MAX_PER_USER = 10
const WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = checkRateLimit(`ai-desc:${user.id}`, MAX_PER_USER, WINDOW_MS)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  try {
    const description = await generateDescription({
      ...parsed.data,
      mileage: parsed.data.mileage ?? null,
    })
    return NextResponse.json({ description, remaining: rl.remaining })
  } catch (err) {
    console.error("[ai/generate-description] Gemini error:", err)
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 })
  }
}

import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { estimatePrice } from "@/lib/ai/provider"
import { checkRateLimit, getClientIp } from "@/lib/ai/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 30

const FUEL = ["essence", "diesel", "hybrid", "electric", "lpg"] as const

const schema = z.object({
  brandId: z.uuid(),
  modelId: z.uuid(),
  year: z.number().int().min(1900).max(2100),
  mileage: z.number().int().nonnegative(),
  fuelType: z.enum(FUEL),
  condition: z.enum(["neuf", "occasion"]),
  conditionGrade: z.enum(["excellent", "very_good", "good", "fair"]).optional(),
  hadAccident: z.boolean().optional(),
  language: z.enum(["ar", "fr"]),
})

// 20 estimations / hour per authenticated user
// 5 estimations / day per IP for anon
const AUTH_LIMIT = { max: 20, windowMs: 60 * 60 * 1000 }
const ANON_LIMIT = { max: 5, windowMs: 24 * 60 * 60 * 1000 }

type RefRow = {
  brand: { id: string; name: string }
  model: { id: string; name: string }
}

async function resolveRefs(
  brandId: string,
  modelId: string,
): Promise<RefRow | null> {
  const supabase = await createClient()
  const [brand, model] = await Promise.all([
    supabase.from("brands").select("id, name").eq("id", brandId).maybeSingle<{ id: string; name: string }>(),
    supabase.from("car_models").select("id, name").eq("id", modelId).maybeSingle<{ id: string; name: string }>(),
  ])
  if (!brand.data || !model.data) return null
  return { brand: brand.data, model: model.data }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const key = user ? `ai-estimate:${user.id}` : `ai-estimate:ip:${getClientIp(req)}`
  const cfg = user ? AUTH_LIMIT : ANON_LIMIT
  const rl = checkRateLimit(key, cfg.max, cfg.windowMs)
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

  const refs = await resolveRefs(parsed.data.brandId, parsed.data.modelId)
  if (!refs) {
    return NextResponse.json({ error: "Unknown brand/model" }, { status: 400 })
  }

  let estimate
  try {
    estimate = await estimatePrice({
      brand: refs.brand.name,
      model: refs.model.name,
      year: parsed.data.year,
      mileage: parsed.data.mileage,
      fuelType: parsed.data.fuelType,
      condition: parsed.data.condition,
      conditionGrade: parsed.data.conditionGrade,
      hadAccident: parsed.data.hadAccident,
      language: parsed.data.language,
    })
  } catch (err) {
    console.error("[ai/estimate-price] estimation error:", err)
    return NextResponse.json({ error: "AI estimation failed" }, { status: 500 })
  }

  // Persist (RLS lets user_id be null or self)
  const insertPayload = {
    user_id: user?.id ?? null,
    brand_id: parsed.data.brandId,
    model_id: parsed.data.modelId,
    city_id: null,
    year: parsed.data.year,
    mileage: parsed.data.mileage,
    fuel_type: parsed.data.fuelType,
    condition: parsed.data.condition,
    estimated_price_min: estimate.priceMin,
    estimated_price_max: estimate.priceMax,
    gemini_response: estimate as unknown,
  }
  const { error: insertError } = await supabase
    .from("estimations")
    .insert(insertPayload as never)
  if (insertError) {
    // Don't fail the request — the estimate is still useful even if logging fails
    console.error("[ai/estimate-price] persistence error:", insertError)
  }

  return NextResponse.json({ ...estimate, remaining: rl.remaining })
}

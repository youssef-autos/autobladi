import "server-only"

import type {
  DescriptionInput,
  PriceEstimate,
  PriceEstimateInput,
} from "@/lib/ai/types"
import {
  descriptionPrompt,
  estimatePrompt,
  parsePriceEstimate,
} from "@/lib/ai/prompts"

// Called over the REST API (not the deprecated @google/generative-ai SDK) so we
// can control `thinkingConfig` and token limits precisely. The key is resolved
// per request (admin-saved DB value, or env fallback) so the admin can manage
// it from the panel without a redeploy.

// Stable, high-free-quota default. Overridable via env. (gemini-2.0-flash-exp
// was retired → 404; plain 2.5-flash is heavily rate-limited on the free tier.)
const DEFAULT_MODEL = "gemini-2.5-flash-lite"

function resolveKey(apiKey?: string): string {
  return apiKey || process.env.GEMINI_API_KEY || ""
}

function resolveModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL
}

export function isGeminiConfigured(apiKey?: string): boolean {
  return !!resolveKey(apiKey)
}

// 2.5+/3.x are "thinking" models — by default they spend the output-token
// budget on hidden reasoning and can return empty/truncated text (which breaks
// JSON parsing). We disable thinking for these fast structured tasks.
function supportsThinking(model: string): boolean {
  return /gemini-(2\.5|3)/.test(model)
}

type GenConfig = {
  temperature?: number
  topP?: number
  maxOutputTokens?: number
  responseMimeType?: string
}

async function generate(
  prompt: string,
  apiKey: string | undefined,
  cfg: GenConfig,
): Promise<string> {
  const key = resolveKey(apiKey)
  if (!key) throw new Error("GEMINI_API_KEY not set")
  const model = resolveModel()

  const generationConfig: Record<string, unknown> = { ...cfg }
  if (supportsThinking(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Gemini returned an empty response")
  return text
}

export async function geminiGenerateDescription(
  carData: DescriptionInput,
  apiKey?: string,
): Promise<string> {
  const text = await generate(descriptionPrompt(carData), apiKey, {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 1024,
  })
  return text.trim()
}

export async function geminiEstimatePrice(
  data: PriceEstimateInput,
  apiKey?: string,
): Promise<PriceEstimate> {
  const text = await generate(estimatePrompt(data), apiKey, {
    temperature: 0.4,
    topP: 0.9,
    maxOutputTokens: 2048,
    responseMimeType: "application/json",
  })
  return parsePriceEstimate(text)
}

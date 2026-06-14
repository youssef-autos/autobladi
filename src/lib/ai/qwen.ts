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

// Qwen (Alibaba Cloud, https://qwen.ai) is served through DashScope's
// OpenAI-compatible endpoint, so the request/response shape matches `openai.ts`
// exactly — only the base URL, key and default model differ. We default to the
// international (Singapore) endpoint since the marketplace is outside mainland
// China; both URL and model stay overridable via env.
const DEFAULT_BASE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
const DEFAULT_MODEL = "qwen-plus"

function resolveKey(apiKey?: string): string {
  return apiKey || process.env.QWEN_API_KEY || ""
}

function resolveBaseUrl(): string {
  return (process.env.QWEN_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "")
}

export function isQwenConfigured(apiKey?: string): boolean {
  return !!resolveKey(apiKey)
}

type ChatMessage = { role: "system" | "user"; content: string }

async function chat(
  messages: ChatMessage[],
  opts: { apiKey?: string; model?: string; json?: boolean; temperature?: number } = {},
): Promise<string> {
  const key = resolveKey(opts.apiKey)
  if (!key) throw new Error("QWEN_API_KEY not set")

  const res = await fetch(`${resolveBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model || process.env.QWEN_MODEL || DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.6,
      max_tokens: 1024,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Qwen ${res.status}: ${detail.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error("Qwen returned an empty response")
  return text
}

export async function qwenGenerateDescription(
  carData: DescriptionInput,
  apiKey?: string,
  model?: string,
): Promise<string> {
  const text = await chat([{ role: "user", content: descriptionPrompt(carData) }], {
    apiKey,
    model,
    temperature: 0.7,
  })
  return text.trim()
}

export async function qwenEstimatePrice(
  data: PriceEstimateInput,
  apiKey?: string,
  model?: string,
): Promise<PriceEstimate> {
  const text = await chat(
    [
      {
        role: "system",
        content:
          "You are a Moroccan used-car pricing expert. Reply ONLY with valid JSON.",
      },
      { role: "user", content: estimatePrompt(data) },
    ],
    { apiKey, model, json: true, temperature: 0.4 },
  )
  return parsePriceEstimate(text)
}

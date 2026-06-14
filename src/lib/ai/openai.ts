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

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"
const DEFAULT_MODEL = "gpt-4o-mini"

function resolveKey(apiKey?: string): string {
  return apiKey || process.env.OPENAI_API_KEY || ""
}

export function isOpenAIConfigured(apiKey?: string): boolean {
  return !!resolveKey(apiKey)
}

type ChatMessage = { role: "system" | "user"; content: string }

async function chat(
  messages: ChatMessage[],
  opts: { apiKey?: string; model?: string; json?: boolean; temperature?: number } = {},
): Promise<string> {
  const key = resolveKey(opts.apiKey)
  if (!key) throw new Error("OPENAI_API_KEY not set")

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model || process.env.OPENAI_MODEL || DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.6,
      max_tokens: 1024,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error("OpenAI returned an empty response")
  return text
}

export async function openaiGenerateDescription(
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

export async function openaiEstimatePrice(
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

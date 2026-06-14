import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type {
  DescriptionInput,
  PriceEstimate,
  PriceEstimateInput,
} from "@/lib/ai/types"
import {
  geminiEstimatePrice,
  geminiGenerateDescription,
  isGeminiConfigured,
} from "@/lib/ai/gemini"
import {
  isOpenAIConfigured,
  openaiEstimatePrice,
  openaiGenerateDescription,
} from "@/lib/ai/openai"
import {
  isQwenConfigured,
  qwenEstimatePrice,
  qwenGenerateDescription,
} from "@/lib/ai/qwen"

export type AiProvider = "gemini" | "openai" | "qwen"
export const AI_PROVIDERS: AiProvider[] = ["gemini", "openai", "qwen"]

type AiConfig = {
  provider: AiProvider
  geminiKey: string
  openaiKey: string
  openaiModel: string
  qwenKey: string
  qwenModel: string
}

/**
 * Loads AI config from the admin-only `ai_settings` table (via the service-role
 * client — the table holds secrets and is never public). Falls back to env vars
 * for any key the admin hasn't entered, so estimation works either way.
 */
async function getAiConfig(): Promise<AiConfig> {
  let provider: AiProvider = "gemini"
  let geminiKey = ""
  let openaiKey = ""
  let openaiModel = ""
  let qwenKey = ""
  let qwenModel = ""

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("ai_settings")
      .select("provider, gemini_key, openai_key, openai_model, qwen_key, qwen_model")
      .eq("id", true)
      .maybeSingle<{
        provider: string
        gemini_key: string
        openai_key: string
        openai_model: string
        qwen_key: string
        qwen_model: string
      }>()
    if (data) {
      if (
        data.provider === "openai" ||
        data.provider === "gemini" ||
        data.provider === "qwen"
      ) {
        provider = data.provider
      }
      geminiKey = data.gemini_key ?? ""
      openaiKey = data.openai_key ?? ""
      openaiModel = data.openai_model ?? ""
      qwenKey = data.qwen_key ?? ""
      qwenModel = data.qwen_model ?? ""
    }
  } catch {
    // ignore — fall back to env / defaults
  }

  return {
    provider,
    geminiKey: geminiKey || process.env.GEMINI_API_KEY || "",
    openaiKey: openaiKey || process.env.OPENAI_API_KEY || "",
    openaiModel: openaiModel || process.env.OPENAI_MODEL || "",
    qwenKey: qwenKey || process.env.QWEN_API_KEY || "",
    qwenModel: qwenModel || process.env.QWEN_MODEL || "",
  }
}

/** True when the admin-chosen provider actually has a usable key. */
function hasKey(cfg: AiConfig, provider: AiProvider): boolean {
  if (provider === "openai") return isOpenAIConfigured(cfg.openaiKey)
  if (provider === "qwen") return isQwenConfigured(cfg.qwenKey)
  return isGeminiConfigured(cfg.geminiKey)
}

/** Honors the admin choice but falls back to whichever provider has a key. */
function resolveProvider(cfg: AiConfig): AiProvider {
  if (hasKey(cfg, cfg.provider)) return cfg.provider
  // Fallback order: gemini → openai → qwen (whichever is configured).
  for (const p of AI_PROVIDERS) {
    if (hasKey(cfg, p)) return p
  }
  return cfg.provider
}

export async function estimatePrice(
  data: PriceEstimateInput,
): Promise<PriceEstimate> {
  const cfg = await getAiConfig()
  switch (resolveProvider(cfg)) {
    case "openai":
      return openaiEstimatePrice(data, cfg.openaiKey, cfg.openaiModel)
    case "qwen":
      return qwenEstimatePrice(data, cfg.qwenKey, cfg.qwenModel)
    default:
      return geminiEstimatePrice(data, cfg.geminiKey)
  }
}

export async function generateDescription(
  carData: DescriptionInput,
): Promise<string> {
  const cfg = await getAiConfig()
  switch (resolveProvider(cfg)) {
    case "openai":
      return openaiGenerateDescription(carData, cfg.openaiKey, cfg.openaiModel)
    case "qwen":
      return qwenGenerateDescription(carData, cfg.qwenKey, cfg.qwenModel)
    default:
      return geminiGenerateDescription(carData, cfg.geminiKey)
  }
}

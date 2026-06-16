import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { SettingsForm } from "@/components/admin/SettingsForm"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { createClient } from "@/lib/supabase/server"
import type { SettingsInput } from "@/app/[locale]/admin/parametres/actions"

export const dynamic = "force-dynamic"

function toString(raw: unknown, fallback = ""): string {
  if (typeof raw === "string") return raw
  if (raw && typeof raw === "object" && "text" in raw) {
    const v = (raw as { text: unknown }).text
    if (typeof v === "string") return v
  }
  return fallback
}

function toNumber(raw: unknown, fallback: number): number {
  if (typeof raw === "number") return raw
  if (typeof raw === "string" && !Number.isNaN(Number(raw))) return Number(raw)
  return fallback
}

export default async function AdminParametresPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.settings")

  // Defensive in-page auth (middleware already enforces /admin → admin role)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion`)

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  if (profile?.account_type !== "admin") redirect(`/${locale}`)

  const { data: rows } = await supabase.from("site_settings").select("key, value")
  const settings = (rows ?? []) as unknown as Array<{ key: string; value: unknown }>
  const map = new Map(settings.map((r) => [r.key, r.value]))

  // AI provider + keys live in the admin-only `ai_settings` table (secrets).
  const { data: aiRow } = await supabase
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

  // Fall back to the legacy single logo so an existing logo still appears.
  const legacyLogo = toString(map.get("site_logo_url"), "")
  const initial: SettingsInput = {
    site_logo_url_light: toString(map.get("site_logo_url_light"), legacyLogo),
    site_logo_url_dark: toString(map.get("site_logo_url_dark"), ""),
    site_favicon_url: toString(map.get("site_favicon_url"), ""),
    google_site_verification: toString(map.get("google_site_verification"), ""),
    bing_site_verification: toString(map.get("bing_site_verification"), ""),
    watermark_text: toString(map.get("watermark_text"), "autobladi.ma"),
    annonce_duration_days: toNumber(map.get("annonce_duration_days"), 60),
    annonce_duration_days_pro: toNumber(map.get("annonce_duration_days_pro"), 90),
    free_max_annonces: toNumber(map.get("free_max_annonces"), 3),
    subscription_grace_days: toNumber(map.get("subscription_grace_days"), 7),
    ai_provider:
      aiRow?.provider === "openai" || aiRow?.provider === "qwen"
        ? aiRow.provider
        : "gemini",
    // Secrets are never echoed back to the browser — a blank field on submit
    // means "keep the saved key". We only signal whether one already exists.
    ai_gemini_key: "",
    ai_openai_key: "",
    ai_openai_model: aiRow?.openai_model ?? "",
    ai_qwen_key: "",
    ai_qwen_model: aiRow?.qwen_model ?? "",
    contact_email: toString(map.get("contact_email"), "contact@autobladi.ma"),
    contact_phone: toString(map.get("contact_phone"), ""),
    bank_name: toString(map.get("bank_name"), ""),
    rib: toString(map.get("rib"), ""),
    bank_beneficiary: toString(map.get("bank_beneficiary"), ""),
  }

  return (
    <section className="py-8 md:py-12">
      <Container className="max-w-3xl">
        <header className="space-y-3 mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            {t("pageTitle")}
          </h1>
          <GoldAccent />
          <p className="text-muted-foreground">{t("pageSubtitle")}</p>
        </header>

        <SettingsForm
          initial={initial}
          geminiKeySet={!!aiRow?.gemini_key}
          openaiKeySet={!!aiRow?.openai_key}
          qwenKeySet={!!aiRow?.qwen_key}
        />
      </Container>
    </section>
  )
}

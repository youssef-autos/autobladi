"use client"

import { useRef, useState, useTransition } from "react"
import {
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode2,
  Files,
  Globe,
  ImageIcon,
  Loader2,
  Mail,
  Map,
  Rss,
  Save,
  Search,
  Sparkles,
  Stamp,
  Upload,
  X,
  Zap,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  saveSettings,
  type SettingsInput,
} from "@/app/[locale]/admin/parametres/actions"
import { uploadSiteLogo } from "@/app/[locale]/admin/parametres/upload-action"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  initial: SettingsInput
  geminiKeySet: boolean
  openaiKeySet: boolean
  qwenKeySet: boolean
  siteUrl: string
  indexNowReady: boolean
}

export function SettingsForm({
  initial,
  geminiKeySet,
  openaiKeySet,
  qwenKeySet,
  siteUrl,
  indexNowReady,
}: Props) {
  const t = useTranslations("admin.settings")
  const tSeo = useTranslations("adminPanel.seoPage")
  const [values, setValues] = useState<SettingsInput>(initial)
  const [pending, startTransition] = useTransition()

  function update<K extends keyof SettingsInput>(k: K, value: SettingsInput[K]) {
    setValues((prev) => ({ ...prev, [k]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveSettings(values)
      if (!result.ok) {
        toast.error(t("errorTitle"), {
          description: result.error === "forbidden" ? t("errorAuth") : result.error,
        })
        return
      }
      toast.success(t("successTitle"), { description: t("successDesc") })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logos (light + dark) */}
      <Section title={t("logo")} icon={ImageIcon}>
        <p className="text-xs text-muted-foreground mb-4">{t("logoHelp")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <LogoUploader
            label={t("logoLight")}
            value={values.site_logo_url_light}
            onChange={(url) => update("site_logo_url_light", url)}
            hint={t("logoSizeHint")}
            bg="light"
          />
          <LogoUploader
            label={t("logoDark")}
            value={values.site_logo_url_dark}
            onChange={(url) => update("site_logo_url_dark", url)}
            hint={t("logoSizeHint")}
            bg="dark"
          />
        </div>
      </Section>

      {/* Favicon */}
      <Section title={t("favicon")} icon={Globe}>
        <p className="text-xs text-muted-foreground mb-4">{t("faviconHelp")}</p>
        <LogoUploader
          label={t("favicon")}
          value={values.site_favicon_url}
          onChange={(url) => update("site_favicon_url", url)}
        />
      </Section>

      {/* SEO Verification */}
      <Section title={t("seoVerification")} icon={Search}>
        <p className="text-xs text-muted-foreground -mt-1">{t("seoVerificationHelp")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            id="gsc"
            label={t("googleVerification")}
            help={t("googleVerificationHelp")}
          >
            <Input
              id="gsc"
              value={values.google_site_verification}
              onChange={(e) => update("google_site_verification", e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              maxLength={200}
              className="h-11 rounded-xl font-mono text-xs"
              dir="ltr"
            />
          </Field>
          <Field
            id="bing"
            label={t("bingVerification")}
            help={t("bingVerificationHelp")}
          >
            <Input
              id="bing"
              value={values.bing_site_verification}
              onChange={(e) => update("bing_site_verification", e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              maxLength={200}
              className="h-11 rounded-xl font-mono text-xs"
              dir="ltr"
            />
          </Field>
        </div>
        <div className="mt-2 border-t border-border/60 pt-4">
          <Field
            id="ga_id"
            label={t("googleAnalytics")}
            help={t("googleAnalyticsHelp")}
          >
            <Input
              id="ga_id"
              value={values.google_analytics_id}
              onChange={(e) => update("google_analytics_id", e.target.value)}
              placeholder="G-XXXXXXXXXX"
              maxLength={30}
              className="h-11 rounded-xl font-mono text-sm max-w-[280px]"
              dir="ltr"
            />
          </Field>
        </div>

        {/* Consoles */}
        <div className="mt-2 border-t border-border/60 pt-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">{tSeo("consolesTitle")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{tSeo("consolesHelp")}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2.5 hover:border-moroccan-gold-500/60 hover:bg-moroccan-gold-50/40 transition-colors text-sm font-medium text-foreground"
            >
              Google Search Console
              <ExternalLink className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            </a>
            <a
              href="https://www.bing.com/webmasters"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2.5 hover:border-moroccan-gold-500/60 hover:bg-moroccan-gold-50/40 transition-colors text-sm font-medium text-foreground"
            >
              Bing Webmaster Tools
              <ExternalLink className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* IndexNow */}
        <div className="border-t border-border/60 pt-4 flex items-start gap-3">
          <Zap className="size-4 text-moroccan-gold-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{tSeo("indexNowTitle")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{tSeo("indexNowDesc")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {indexNowReady ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  {tSeo("indexNowOn")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                  {tSeo("indexNowOff")}
                </span>
              )}
              {indexNowReady && (
                <a
                  href={`${siteUrl}/indexnow.txt`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-moroccan-red-600 hover:underline"
                >
                  /indexnow.txt
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Resource links */}
        <div className="border-t border-border/60 pt-4 grid gap-2 sm:grid-cols-3">
          {([
            { icon: Map, title: tSeo("sitemapTitle"), desc: tSeo("sitemapDesc"), path: "/sitemap.xml" },
            { icon: FileCode2, title: tSeo("robotsTitle"), desc: tSeo("robotsDesc"), path: "/robots.txt" },
            { icon: Rss, title: tSeo("rssTitle"), desc: tSeo("rssDesc"), path: "/feed.xml" },
          ] as const).map(({ icon: Icon, title, desc, path }) => (
            <a
              key={path}
              href={`${siteUrl}${path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-border bg-background p-3 hover:border-moroccan-gold-500/60 transition-colors group"
            >
              <div className="flex items-center gap-2 text-foreground">
                <Icon className="size-4 text-moroccan-red-600 shrink-0" aria-hidden="true" />
                <span className="text-sm font-semibold">{title}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-mono text-muted-foreground group-hover:text-moroccan-red-600">
                {path}
                <ExternalLink className="size-3" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </Section>

      {/* Watermark */}
      <Section title={t("watermark")} icon={Stamp}>
        <Field id="wm" label={t("watermarkText")} help={t("watermarkHelp")}>
          <Input
            id="wm"
            value={values.watermark_text}
            onChange={(e) => update("watermark_text", e.target.value)}
            className="h-11 rounded-xl"
            maxLength={100}
            required
          />
        </Field>
      </Section>

      {/* Annonce duration — split by account type */}
      <Section title={t("duration")} icon={Clock}>
        <p className="text-xs text-muted-foreground -mt-1">{t("durationHelp")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            id="duration"
            label={t("durationGratuit")}
            help={t("durationGratuitHelp")}
          >
            <Input
              id="duration"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              value={values.annonce_duration_days}
              onChange={(e) =>
                update("annonce_duration_days", Number(e.target.value) || 60)
              }
              className="h-11 rounded-xl max-w-[200px]"
              required
            />
          </Field>
          <Field
            id="duration_pro"
            label={t("durationPro")}
            help={t("durationProHelp")}
          >
            <Input
              id="duration_pro"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              value={values.annonce_duration_days_pro}
              onChange={(e) =>
                update("annonce_duration_days_pro", Number(e.target.value) || 90)
              }
              className="h-11 rounded-xl max-w-[200px]"
              required
            />
          </Field>
        </div>
        <div className="mt-2 border-t border-border/60 pt-4">
          <Field
            id="grace_days"
            label={t("graceDays")}
            help={t("graceDaysHelp")}
          >
            <Input
              id="grace_days"
              type="number"
              inputMode="numeric"
              min={0}
              max={90}
              value={values.subscription_grace_days}
              onChange={(e) =>
                update("subscription_grace_days", Number(e.target.value) || 0)
              }
              className="h-11 rounded-xl max-w-[200px]"
              required
            />
          </Field>
        </div>
      </Section>

      {/* Annonce limit — free accounts */}
      <Section title={t("annonceLimit")} icon={Files}>
        <Field
          id="free_max"
          label={t("freeMaxAnnonces")}
          help={t("freeMaxAnnoncesHelp")}
        >
          <Input
            id="free_max"
            type="number"
            inputMode="numeric"
            min={0}
            max={1000}
            value={values.free_max_annonces}
            onChange={(e) =>
              update("free_max_annonces", Number(e.target.value) || 0)
            }
            className="h-11 rounded-xl max-w-[200px]"
            required
          />
        </Field>
      </Section>

      {/* AI provider for estimation + description generation */}
      <Section title={t("aiProvider")} icon={Sparkles}>
        <p className="text-xs text-muted-foreground -mt-1">{t("aiProviderHelp")}</p>
        <Field id="ai_provider" label={t("aiProviderLabel")}>
          <select
            id="ai_provider"
            value={values.ai_provider}
            onChange={(e) => {
              const v = e.target.value
              update(
                "ai_provider",
                v === "openai" || v === "qwen" ? v : "gemini",
              )
            }}
            className="h-11 w-full max-w-[280px] rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="gemini">{t("aiGemini")}</option>
            <option value="openai">{t("aiOpenai")}</option>
            <option value="qwen">{t("aiQwen")}</option>
          </select>
        </Field>

        <div className="mt-2 border-t border-border/60 pt-4 grid grid-cols-1 gap-4">
          <Field id="ai_gemini_key" label={t("aiGeminiKey")} help={t("aiKeyHelp")}>
            <Input
              id="ai_gemini_key"
              type="password"
              autoComplete="off"
              value={values.ai_gemini_key}
              onChange={(e) => update("ai_gemini_key", e.target.value)}
              placeholder={geminiKeySet ? t("aiKeySaved") : "AIza…"}
              maxLength={500}
              className="h-11 rounded-xl font-mono"
            />
          </Field>

          <Field id="ai_openai_key" label={t("aiOpenaiKey")} help={t("aiKeyHelp")}>
            <Input
              id="ai_openai_key"
              type="password"
              autoComplete="off"
              value={values.ai_openai_key}
              onChange={(e) => update("ai_openai_key", e.target.value)}
              placeholder={openaiKeySet ? t("aiKeySaved") : "sk-…"}
              maxLength={500}
              className="h-11 rounded-xl font-mono"
            />
          </Field>

          <Field id="ai_openai_model" label={t("aiModel")} help={t("aiModelHelp")}>
            <Input
              id="ai_openai_model"
              value={values.ai_openai_model}
              onChange={(e) => update("ai_openai_model", e.target.value)}
              placeholder="gpt-4o-mini"
              maxLength={100}
              className="h-11 rounded-xl font-mono max-w-[280px]"
            />
          </Field>

          <Field id="ai_qwen_key" label={t("aiQwenKey")} help={t("aiQwenKeyHelp")}>
            <Input
              id="ai_qwen_key"
              type="password"
              autoComplete="off"
              value={values.ai_qwen_key}
              onChange={(e) => update("ai_qwen_key", e.target.value)}
              placeholder={qwenKeySet ? t("aiKeySaved") : "sk-…"}
              maxLength={500}
              className="h-11 rounded-xl font-mono"
            />
          </Field>

          <Field id="ai_qwen_model" label={t("aiQwenModel")} help={t("aiQwenModelHelp")}>
            <Input
              id="ai_qwen_model"
              value={values.ai_qwen_model}
              onChange={(e) => update("ai_qwen_model", e.target.value)}
              placeholder="qwen-plus"
              maxLength={100}
              className="h-11 rounded-xl font-mono max-w-[280px]"
            />
          </Field>
        </div>
      </Section>

      {/* Bank details */}
      <Section title={t("bank")} icon={Banknote}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field id="bank_name" label={t("bankName")}>
            <Input
              id="bank_name"
              value={values.bank_name}
              onChange={(e) => update("bank_name", e.target.value)}
              placeholder={t("bankNamePlaceholder")}
              maxLength={100}
              className="h-11 rounded-xl"
            />
          </Field>
          <Field id="beneficiary" label={t("beneficiary")}>
            <Input
              id="beneficiary"
              value={values.bank_beneficiary}
              onChange={(e) => update("bank_beneficiary", e.target.value)}
              placeholder={t("beneficiaryPlaceholder")}
              maxLength={100}
              className="h-11 rounded-xl"
            />
          </Field>
        </div>
        <Field id="rib" label={t("rib")} help={t("ribHelp")}>
          <Textarea
            id="rib"
            value={values.rib}
            onChange={(e) => update("rib", e.target.value)}
            rows={2}
            maxLength={200}
            className="rounded-xl font-mono"
          />
        </Field>
      </Section>

      {/* Contact */}
      <Section title={t("contact")} icon={Mail}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field id="email" label={t("contactEmail")}>
            <Input
              id="email"
              type="email"
              value={values.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
              className="h-11 rounded-xl"
            />
          </Field>
          <Field id="phone" label={t("contactPhone")}>
            <Input
              id="phone"
              type="tel"
              value={values.contact_phone}
              onChange={(e) => update("contact_phone", e.target.value)}
              className="h-11 rounded-xl"
            />
          </Field>
        </div>
      </Section>

      <div className="pt-4 border-t border-border">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all disabled:opacity-60"
        >
          <Save className="size-4" aria-hidden="true" />
          {pending ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  )
}

/** A single logo upload slot. bg="dark" renders a dark preview to show white logos. */
function LogoUploader({
  label,
  value,
  onChange,
  hint,
  bg = "light",
}: {
  label: string
  value: string
  onChange: (url: string) => void
  hint?: string
  bg?: "light" | "dark"
}) {
  const t = useTranslations("admin.settings")
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await uploadSiteLogo(fd)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      onChange(res.url)
      toast.success(t("logoUploaded"))
    } finally {
      setUploading(false)
    }
  }

  const previewBg =
    bg === "dark"
      ? "bg-[#1a0506] border-white/10"
      : "bg-moroccan-sand-50 border-border"

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      <span
        className={`flex h-20 w-full max-w-[180px] items-center justify-center overflow-hidden rounded-xl border ${previewBg}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span
            className={`text-xs ${bg === "dark" ? "text-white/40" : "text-muted-foreground"}`}
          >
            {t("noLogo")}
          </span>
        )}
      </span>
      {hint && (
        <p className="text-[11px] leading-snug text-muted-foreground/80 max-w-[180px]">
          {hint}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-dashed border-moroccan-gold-500/60 bg-moroccan-gold-50/40 text-xs font-medium text-moroccan-gold-700 hover:bg-moroccan-gold-50 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          {uploading ? t("uploading") : t("uploadLogo")}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="size-9 inline-flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-moroccan-red-50 hover:text-moroccan-red-600"
            aria-label={t("removeLogo")}
          >
            <X className="size-4" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleUpload(file)
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
      <h2 className="flex items-center gap-2.5 font-semibold text-foreground">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-moroccan-sand-50 text-moroccan-red-500">
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({
  id,
  label,
  help,
  children,
}: {
  id: string
  label: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { Save } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { saveSocialLogin } from "@/app/[locale]/admin/settings/social-login/actions"
import { Field } from "@/components/ui/Field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { SocialLoginConfig, ProviderConfig } from "@/lib/queries/social-login"

type Props = {
  initial: SocialLoginConfig
}

export function SocialLoginForm({ initial }: Props) {
  const t = useTranslations("adminPanel.socialLoginPage")
  const [facebook, setFacebook] = useState<ProviderConfig>(initial.facebook)
  const [google, setGoogle] = useState<ProviderConfig>(initial.google)
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const res = await saveSocialLogin({ facebook, google })
      if (!res.ok) {
        toast.error(t("error"))
        return
      }
      toast.success(t("saved"))
    })
  }

  return (
    <div className="space-y-6">
      <ProviderCard
        title={t("facebook")}
        value={facebook}
        onChange={setFacebook}
        clientIdLabel={t("fbClientId")}
        secretLabel={t("fbSecret")}
        accent="text-[#1877F2]"
      />
      <ProviderCard
        title={t("google")}
        value={google}
        onChange={setGoogle}
        clientIdLabel={t("googleClientId")}
        secretLabel={t("googleSecret")}
        accent="text-moroccan-red-500"
      />

      <p className="rounded-xl border border-moroccan-gold-500/30 bg-moroccan-gold-50/40 px-4 py-3 text-xs text-moroccan-gold-700">
        {t("supabaseNote")}
      </p>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-brand-dark text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
      >
        <Save className="size-4" aria-hidden="true" />
        {pending ? t("saving") : t("update")}
      </button>
    </div>
  )
}

function ProviderCard({
  title,
  value,
  onChange,
  clientIdLabel,
  secretLabel,
  accent,
}: {
  title: string
  value: ProviderConfig
  onChange: (v: ProviderConfig) => void
  clientIdLabel: string
  secretLabel: string
  accent: string
}) {
  const t = useTranslations("adminPanel.socialLoginPage")
  const set = (patch: Partial<ProviderConfig>) => onChange({ ...value, ...patch })

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
      <h2 className={`font-display text-xl font-bold ${accent}`}>{title}</h2>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5">
        <span className="text-sm font-medium text-foreground">{t("visibility")}</span>
        <Switch
          checked={value.enabled}
          onCheckedChange={(v) => set({ enabled: v === true })}
        />
      </label>

      <Field label={clientIdLabel}>
        <Input
          value={value.clientId}
          onChange={(e) => set({ clientId: e.target.value })}
          dir="ltr"
          className="h-11 rounded-xl font-mono text-xs"
        />
      </Field>

      <Field label={secretLabel}>
        <Input
          type="password"
          value={value.secret}
          onChange={(e) => set({ secret: e.target.value })}
          dir="ltr"
          autoComplete="off"
          className="h-11 rounded-xl font-mono text-xs"
        />
      </Field>

      <Field label={t("redirectUrl")}>
        <Input
          value={value.redirectUrl}
          onChange={(e) => set({ redirectUrl: e.target.value })}
          dir="ltr"
          placeholder="https://autobladi.ma/ar/auth/callback"
          className="h-11 rounded-xl font-mono text-xs"
        />
      </Field>
    </section>
  )
}


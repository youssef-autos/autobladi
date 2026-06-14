"use client"

import { useState, useTransition } from "react"
import { Save } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { saveSeoSettings } from "@/app/[locale]/admin/settings/seo/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  initial: {
    google_site_verification: string
    bing_site_verification: string
  }
}

export function SeoSettingsForm({ initial }: Props) {
  const t = useTranslations("adminPanel.seoPage")
  const [google, setGoogle] = useState(initial.google_site_verification)
  const [bing, setBing] = useState(initial.bing_site_verification)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await saveSeoSettings({
        google_site_verification: google,
        bing_site_verification: bing,
      })
      if (!res.ok) {
        toast.error(t("saveError"))
        return
      }
      toast.success(t("saved"))
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5"
    >
      <div>
        <h2 className="font-semibold text-foreground">{t("verifyTitle")}</h2>
        <p className="text-xs text-muted-foreground mt-1">{t("verifyHelp")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gsc" className="text-sm font-medium">
          {t("googleLabel")}
        </Label>
        <Input
          id="gsc"
          value={google}
          onChange={(e) => setGoogle(e.target.value)}
          placeholder="google-site-verification=…"
          maxLength={200}
          autoComplete="off"
          className="h-11 rounded-xl font-mono"
        />
        <p className="text-xs text-muted-foreground">{t("googleHelp")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bing" className="text-sm font-medium">
          {t("bingLabel")}
        </Label>
        <Input
          id="bing"
          value={bing}
          onChange={(e) => setBing(e.target.value)}
          placeholder="msvalidate.01"
          maxLength={200}
          autoComplete="off"
          className="h-11 rounded-xl font-mono"
        />
        <p className="text-xs text-muted-foreground">{t("bingHelp")}</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all disabled:opacity-60"
      >
        <Save className="size-4" aria-hidden="true" />
        {pending ? t("saving") : t("save")}
      </button>
    </form>
  )
}

"use client"

import { useState, useTransition } from "react"
import { Info, Save } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { saveAuthSettings } from "@/app/[locale]/admin/settings/auth/actions"
import { Switch } from "@/components/ui/switch"

type Props = {
  initial: { require_email_confirmation: boolean }
}

export function AuthSettingsForm({ initial }: Props) {
  const t = useTranslations("adminPanel.authSettingsPage")
  const [requireConfirmation, setRequireConfirmation] = useState(
    initial.require_email_confirmation,
  )
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const res = await saveAuthSettings({
        require_email_confirmation: requireConfirmation,
      })
      if (!res.ok) {
        toast.error(t("error"))
        return
      }
      toast.success(t("saved"))
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground">{t("emailSection")}</h2>

        <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 cursor-pointer">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {t("requireConfirmationLabel")}
            </p>
            <p className="text-xs text-muted-foreground">
              {requireConfirmation ? t("confirmationOn") : t("confirmationOff")}
            </p>
          </div>
          <Switch
            checked={requireConfirmation}
            onCheckedChange={(v) => setRequireConfirmation(v === true)}
          />
        </label>

        <div className="flex items-start gap-2.5 rounded-xl border border-moroccan-gold-500/30 bg-moroccan-gold-50/40 px-4 py-3">
          <Info className="size-4 shrink-0 text-moroccan-gold-700 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-moroccan-gold-700 leading-relaxed">
            {requireConfirmation ? t("noteOn") : t("noteOff")}
          </p>
        </div>
      </section>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-brand-dark text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
      >
        <Save className="size-4" aria-hidden="true" />
        {pending ? t("saving") : t("save")}
      </button>
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { saveBankSettings } from "@/app/[locale]/admin/settings/rib/actions"
import { MoroccanButton } from "@/components/ui/MoroccanButton"

type Props = {
  initial: {
    bank_name: string
    rib: string
    beneficiary: string
  }
}

export function RibSettingsForm({ initial }: Props) {
  const t = useTranslations("adminPanel.ribSettings")
  const [pending, startTransition] = useTransition()
  const [bankName, setBankName] = useState(initial.bank_name)
  const [rib, setRib] = useState(initial.rib)
  const [beneficiary, setBeneficiary] = useState(initial.beneficiary)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const res = await saveBankSettings({
        bank_name: bankName.trim(),
        rib: rib.trim(),
        bank_beneficiary: beneficiary.trim(),
      })
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.saved"))
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-lg rounded-2xl border border-border bg-card p-5 md:p-6 shadow-card space-y-5"
    >
      <Field label={t("bankName")}>
        <input
          type="text"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder={t("bankNamePlaceholder")}
          maxLength={100}
          className={inputCls}
        />
      </Field>

      <Field label={t("rib")} hint={t("ribHint")}>
        <input
          type="text"
          value={rib}
          onChange={(e) => setRib(e.target.value)}
          placeholder={t("ribPlaceholder")}
          maxLength={120}
          className={`${inputCls} font-mono tabular-nums`}
        />
      </Field>

      <Field label={t("beneficiary")}>
        <input
          type="text"
          value={beneficiary}
          onChange={(e) => setBeneficiary(e.target.value)}
          placeholder={t("beneficiaryPlaceholder")}
          maxLength={100}
          className={inputCls}
        />
      </Field>

      <div className="flex justify-end pt-1">
        <MoroccanButton type="submit" size="sm" loading={pending}>
          {pending ? t("saving") : t("save")}
        </MoroccanButton>
      </div>
    </form>
  )
}

const inputCls =
  "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

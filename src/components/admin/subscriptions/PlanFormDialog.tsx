"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  createPlan,
  updatePlan,
} from "@/app/[locale]/admin/subscriptions/plans/actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { Switch } from "@/components/ui/switch"
import type { AdminPlanRow } from "@/lib/queries/admin"
import { planDiscountPercent } from "@/lib/plan-pricing"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: AdminPlanRow | null
}

export function PlanFormDialog({ open, onOpenChange, initial }: Props) {
  const t = useTranslations("adminPanel.plansPage")
  const isEdit = !!initial

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] max-w-md flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>{isEdit ? t("form.edit") : t("addPlan")}</DialogTitle>
        </DialogHeader>
        {open && (
          <InnerForm
            key={initial?.id ?? "new"}
            initial={initial ?? null}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function toFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string")
  }
  return []
}

function InnerForm({
  initial,
  onClose,
}: {
  initial: AdminPlanRow | null
  onClose: () => void
}) {
  const t = useTranslations("adminPanel.plansPage")
  const tForm = useTranslations("adminPanel.plansPage.form")
  const [pending, startTransition] = useTransition()
  const isEdit = !!initial

  const [name, setName] = useState(initial?.name ?? "")
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? "")
  const [price, setPrice] = useState(initial?.price ?? 0)
  const [originalPrice, setOriginalPrice] = useState(
    initial?.original_price ?? 0,
  )
  const [durationDays, setDurationDays] = useState(initial?.duration_days ?? 30)
  const [maxAnnonces, setMaxAnnonces] = useState(initial?.max_annonces ?? 1)
  const [features, setFeatures] = useState(
    toFeatures(initial?.features).join("\n"),
  )
  const [featuresAr, setFeaturesAr] = useState(
    toFeatures(initial?.features_ar).join("\n"),
  )
  const [tagline, setTagline] = useState(initial?.tagline ?? "")
  const [taglineAr, setTaglineAr] = useState(initial?.tagline_ar ?? "")
  const [isPopular, setIsPopular] = useState(initial?.is_popular ?? false)
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)

  // Auto-computed; never entered by hand.
  const computedDiscount = planDiscountPercent(
    Number(originalPrice) || 0,
    Number(price) || 0,
  )

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      name: name.trim(),
      name_ar: nameAr.trim() || null,
      price: Number(price) || 0,
      original_price: Number(originalPrice) || 0,
      duration_days: Number(durationDays) || 1,
      max_annonces: Number(maxAnnonces) || 0,
      features: features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      features_ar: featuresAr
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      tagline: tagline.trim() || null,
      tagline_ar: taglineAr.trim() || null,
      is_popular: isPopular,
      is_active: isActive,
    }
    startTransition(async () => {
      const res = isEdit
        ? await updatePlan({ ...payload, id: initial!.id })
        : await createPlan(payload)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(isEdit ? t("toast.updated") : t("toast.created"))
      onClose()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-4 overflow-y-auto px-4 py-4">
      <Field label={tForm("name")}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tForm("namePlaceholder")}
          required
          maxLength={60}
          className={inputCls}
        />
      </Field>

      <Field label={tForm("nameAr")}>
        <input
          type="text"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          placeholder={tForm("nameArPlaceholder")}
          dir="rtl"
          maxLength={60}
          className={inputCls}
        />
      </Field>

      <Field label={tForm("tagline")}>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder={tForm("taglinePlaceholder")}
          dir="ltr"
          maxLength={200}
          className={inputCls}
        />
      </Field>

      <Field label={tForm("taglineAr")}>
        <input
          type="text"
          value={taglineAr}
          onChange={(e) => setTaglineAr(e.target.value)}
          placeholder={tForm("taglineArPlaceholder")}
          dir="rtl"
          maxLength={200}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={tForm("price")} hint={tForm("priceHelp")}>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            min={0}
            required
            className={inputCls}
          />
        </Field>
        <Field label={tForm("originalPrice")} hint={tForm("originalPriceHelp")}>
          <input
            type="number"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(Number(e.target.value) || 0)}
            min={0}
            className={inputCls}
          />
        </Field>
      </div>

      {computedDiscount > 0 && (
        <p className="rounded-xl border border-moroccan-mint-500/30 bg-moroccan-mint-500/5 px-3.5 py-2.5 text-sm font-medium text-moroccan-mint-700">
          {tForm("autoDiscount", { percent: computedDiscount })}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label={tForm("duration")}>
          <input
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value) || 0)}
            min={1}
            required
            className={inputCls}
          />
        </Field>
        <Field label={tForm("maxAnnonces")} hint={tForm("maxAnnoncesHelp")}>
          <input
            type="number"
            value={maxAnnonces}
            onChange={(e) => setMaxAnnonces(Number(e.target.value) || 0)}
            min={0}
            required
            className={inputCls}
          />
        </Field>
      </div>

      <Field label={tForm("featuresFr")} hint={tForm("featuresHelp")}>
        <textarea
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          rows={4}
          dir="ltr"
          placeholder={tForm("featuresPlaceholder")}
          className={`${inputCls} h-auto resize-y py-2 leading-relaxed`}
        />
      </Field>

      <Field label={tForm("featuresAr")} hint={tForm("featuresHelp")}>
        <textarea
          value={featuresAr}
          onChange={(e) => setFeaturesAr(e.target.value)}
          rows={4}
          dir="rtl"
          placeholder={tForm("featuresArPlaceholder")}
          className={`${inputCls} h-auto resize-y py-2 leading-relaxed`}
        />
      </Field>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">
            {tForm("popular")}
          </span>
          <span className="block text-xs text-muted-foreground">
            {tForm("popularHelp")}
          </span>
        </span>
        <Switch checked={isPopular} onCheckedChange={(v) => setIsPopular(v === true)} />
      </label>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5">
        <span className="text-sm font-medium text-foreground">
          {tForm("active")}
        </span>
        <Switch checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
      </label>
      </div>

      <div className="flex justify-end gap-2 border-t border-border bg-card px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
        >
          {tForm("cancel")}
        </button>
        <MoroccanButton type="submit" size="sm" loading={pending}>
          {pending ? tForm("saving") : tForm("save")}
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

"use client"

import { useMemo, useTransition } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, ShieldCheck, Sparkles } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import type { PriceEstimate } from "@/lib/ai/types"
import {
  CONDITION_OPTIONS,
  FUEL_OPTIONS,
  estimationFormSchema,
  type EstimationFormValues,
} from "@/lib/validations/estimation"
import type { Brand, CarModel } from "@/lib/queries/home"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  brands: Brand[]
  models: CarModel[]
  onResult: (result: PriceEstimate, values: EstimationFormValues) => void
  onLoadingChange: (loading: boolean) => void
}

export function EstimationForm({
  brands,
  models,
  onResult,
  onLoadingChange,
}: Props) {
  const t = useTranslations("estimation.form")
  const tValidation = useTranslations("estimation.validation")
  const tErrors = useTranslations("estimation.errors")
  const tFuel = useTranslations("annonces.fuel")
  const locale = useLocale() as Locale
  const [pending, startTransition] = useTransition()

  const form = useForm<EstimationFormValues>({
    resolver: zodResolver(estimationFormSchema),
    defaultValues: {
      brandId: "",
      modelId: "",
      year: new Date().getFullYear() - 2,
      mileage: 50000,
      fuelType: "essence",
      conditionGrade: "good",
      accidentHistory: false,
    },
    mode: "onSubmit",
  })

  const selectedBrand = useWatch({ control: form.control, name: "brandId" })

  const brandItems = useMemo<ComboboxOption[]>(
    () => brands.map((b) => ({ value: b.id, label: b.name })),
    [brands],
  )
  const modelItems = useMemo<ComboboxOption[]>(
    () =>
      models
        .filter((m) => m.brand_id === selectedBrand)
        .map((m) => ({ value: m.id, label: m.name })),
    [models, selectedBrand],
  )
  const fuelItems = useMemo<ComboboxOption[]>(
    () => FUEL_OPTIONS.map((f) => ({ value: f, label: tFuel(f) })),
    [tFuel],
  )
  const conditionItems = useMemo<ComboboxOption[]>(
    () => CONDITION_OPTIONS.map((c) => ({ value: c, label: t(`conditions.${c}`) })),
    [t],
  )

  const tr = (key?: string) =>
    key?.startsWith("estimation.validation.")
      ? tValidation(key.slice("estimation.validation.".length))
      : (key ?? "")

  function onSubmit(values: EstimationFormValues) {
    onLoadingChange(true)
    startTransition(async () => {
      try {
        const payload = {
          brandId: values.brandId,
          modelId: values.modelId,
          year: values.year,
          mileage: values.mileage,
          fuelType: values.fuelType,
          condition: values.conditionGrade === "neuf" ? "neuf" : "occasion",
          conditionGrade:
            values.conditionGrade === "neuf" ? undefined : values.conditionGrade,
          hadAccident: values.accidentHistory,
          language: locale,
        }
        const res = await fetch("/api/ai/estimate-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.status === 429) {
          toast.error(tErrors("rateLimited"))
          return
        }
        if (!res.ok) {
          toast.error(tErrors("generic"))
          return
        }
        const data = (await res.json()) as PriceEstimate
        onResult(data, values)
      } catch {
        toast.error(tErrors("generic"))
      } finally {
        onLoadingChange(false)
      }
    })
  }

  const errors = form.formState.errors

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-7"
    >
      <header className="space-y-1">
        <h2 className="font-display text-lg font-bold text-foreground">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* Core specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("brand")} error={tr(errors.brandId?.message)}>
          <Controller
            control={form.control}
            name="brandId"
            render={({ field }) => (
              <Combobox
                items={brandItems}
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v)
                  form.setValue("modelId", "")
                }}
                placeholder={t("selectPlaceholder")}
                emptyText={t("noResults")}
              />
            )}
          />
        </Field>

        <Field label={t("model")} error={tr(errors.modelId?.message)}>
          <Controller
            control={form.control}
            name="modelId"
            render={({ field }) => (
              <Combobox
                items={modelItems}
                value={field.value}
                onValueChange={(v) => field.onChange(v)}
                disabled={!selectedBrand}
                placeholder={
                  selectedBrand ? t("selectPlaceholder") : t("selectBrandFirst")
                }
                emptyText={t("noResults")}
              />
            )}
          />
        </Field>

        <Field label={t("year")} error={tr(errors.year?.message)}>
          <Input
            type="number"
            inputMode="numeric"
            min={1990}
            max={new Date().getFullYear() + 1}
            className="h-11 rounded-xl"
            {...form.register("year", { valueAsNumber: true })}
          />
        </Field>

        <Field label={t("mileage")} error={tr(errors.mileage?.message)}>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            placeholder={t("mileagePlaceholder")}
            className="h-11 rounded-xl"
            {...form.register("mileage", { valueAsNumber: true })}
          />
        </Field>

        <Field label={t("fuelType")} error={tr(errors.fuelType?.message)}>
          <Controller
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <Combobox
                items={fuelItems}
                value={field.value}
                onValueChange={(v) => field.onChange(v || "essence")}
                placeholder={t("selectPlaceholder")}
                emptyText={t("noResults")}
              />
            )}
          />
        </Field>

        <Field label={t("condition")} error={tr(errors.conditionGrade?.message)}>
          <Controller
            control={form.control}
            name="conditionGrade"
            render={({ field }) => (
              <Combobox
                items={conditionItems}
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
                placeholder={t("selectPlaceholder")}
                emptyText={t("noResults")}
              />
            )}
          />
        </Field>
      </div>

      {/* Accident history */}
      <fieldset className="space-y-2.5">
        <legend className="text-sm font-medium text-foreground">
          {t("accident")}
        </legend>
        <Controller
          control={form.control}
          name="accidentHistory"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-3">
              <AccidentOption
                icon={ShieldCheck}
                label={t("accidentNo")}
                hint={t("accidentNoHint")}
                active={field.value === false}
                tone="positive"
                onClick={() => field.onChange(false)}
              />
              <AccidentOption
                icon={AlertTriangle}
                label={t("accidentYes")}
                hint={t("accidentYesHint")}
                active={field.value === true}
                tone="warning"
                onClick={() => field.onChange(true)}
              />
            </div>
          )}
        />
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 h-12 w-full rounded-xl bg-moroccan-gradient text-white text-base font-semibold shadow-moroccan hover:brightness-105 transition-all disabled:opacity-60"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  )
}

function AccidentOption({
  icon: Icon,
  label,
  hint,
  active,
  tone,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  hint: string
  active: boolean
  tone: "positive" | "warning"
  onClick: () => void
}) {
  const activeRing =
    tone === "positive"
      ? "border-moroccan-mint-500 bg-moroccan-mint-500/10"
      : "border-moroccan-gold-500 bg-moroccan-gold-50"
  const iconColor =
    tone === "positive" ? "text-moroccan-mint-500" : "text-moroccan-gold-600"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3 text-start transition-all",
        active
          ? `${activeRing} shadow-sm`
          : "border-border bg-background hover:border-moroccan-gold-500/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-card" : "bg-moroccan-sand-50",
          iconColor,
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground leading-snug">
          {hint}
        </span>
      </span>
    </button>
  )
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

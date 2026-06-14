"use client"

import { useEffect, useMemo } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { Video } from "lucide-react"
import { useLocale } from "next-intl"
import { useTranslations } from "next-intl"

import { GenerateDescriptionButton } from "@/components/ai/GenerateDescriptionButton"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { DescriptionInput } from "@/lib/ai/types"
import type { Brand, CarModel } from "@/lib/queries/home"
import type { Locale } from "@/i18n/routing"
import type { AnnonceFormValues } from "@/lib/validations/annonce"
import { cn } from "@/lib/utils"

type Props = {
  brands: Brand[]
  models: CarModel[]
  /** Pro accounts unlock the promo-video field. */
  isPro?: boolean
}

export function Step2DescriptionPrice({ brands, models, isPro = false }: Props) {
  const t = useTranslations("ajouter.step2")
  const tValidation = useTranslations("ajouter.validation")
  const locale = useLocale() as Locale
  const form = useFormContext<AnnonceFormValues>()
  const errors = form.formState.errors

  const tr = (key?: string) =>
    key?.startsWith("ajouter.validation.")
      ? tValidation(key.slice("ajouter.validation.".length))
      : (key ?? "")

  const brandId = form.watch("brandId")
  const modelId = form.watch("modelId")
  const year = form.watch("year")
  const userEditedTitle = form.formState.dirtyFields.title

  const autoTitle = useMemo(() => {
    const brand = brands.find((b) => b.id === brandId)?.name ?? ""
    const model = models.find((m) => m.id === modelId)?.name ?? ""
    return [brand, model, year].filter(Boolean).join(" ")
  }, [brandId, modelId, year, brands, models])

  // Auto-fill title until the user manually edits it
  useEffect(() => {
    if (!userEditedTitle && autoTitle) {
      form.setValue("title", autoTitle, { shouldDirty: false })
    }
  }, [autoTitle, userEditedTitle, form])

  const aiInput = useMemo<DescriptionInput | null>(() => {
    if (!brandId || !modelId || !year) return null
    const brand = brands.find((b) => b.id === brandId)
    const model = models.find((m) => m.id === modelId)
    if (!brand || !model) return null
    return {
      brand: brand.name,
      model: model.name,
      year,
      mileage: form.getValues("mileage") ?? null,
      fuelType: form.getValues("fuelType"),
      transmission: form.getValues("transmission"),
      options: form.getValues("options") ?? [],
      firstOwner: form.getValues("firstOwner") ?? false,
      accidentFree: form.getValues("accidentFree") ?? false,
      condition: form.getValues("condition"),
      language: locale,
    }
  }, [brandId, modelId, year, brands, models, form, locale])

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="font-display text-2xl font-bold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Field label={t("carTitle")} hint={t("titleHint")} error={tr(errors.title?.message)}>
        <Input className="h-11 rounded-xl" {...form.register("title")} />
      </Field>

      <Field
        label={t("description")}
        error={tr(errors.description?.message)}
        action={
          <GenerateDescriptionButton
            carData={aiInput}
            onResult={(text) =>
              form.setValue("description", text, { shouldDirty: true, shouldValidate: true })
            }
          />
        }
      >
        <Textarea
          rows={6}
          placeholder={t("descriptionPlaceholder")}
          className="rounded-xl resize-y"
          {...form.register("description")}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t("price")} error={tr(errors.price?.message)}>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            className="h-11 rounded-xl"
            {...form.register("price", { valueAsNumber: true })}
          />
        </Field>

        <Controller
          control={form.control}
          name="negotiable"
          render={({ field }) => (
            <label className="flex items-end gap-3 cursor-pointer">
              <span
                className={cn(
                  "flex-1 inline-flex items-center justify-between rounded-xl border border-border bg-background px-4 h-11",
                )}
              >
                <span className="text-sm font-medium">{t("negotiable")}</span>
                <Switch
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              </span>
            </label>
          )}
        />

        <Field label={t("contactPhone")} error={tr(errors.contactPhone?.message)}>
          <Input
            type="tel"
            placeholder="+212 6 00 00 00 00"
            className="h-11 rounded-xl"
            {...form.register("contactPhone")}
          />
        </Field>

        <Field label={t("contactWhatsapp")} error={tr(errors.contactWhatsapp?.message)}>
          <Input
            type="tel"
            placeholder="+212 6 00 00 00 00"
            className="h-11 rounded-xl"
            {...form.register("contactWhatsapp", {
              setValueAs: (v: string) => (v === "" ? null : v),
            })}
          />
        </Field>
      </div>

      {/* Promo video — professionals only */}
      {isPro && (
        <div className="rounded-xl border border-moroccan-gold-500/30 bg-moroccan-gold-50/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-moroccan-gold-500/15 text-moroccan-gold-600">
              <Video className="size-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-moroccan-gold-700">
              {t("proBadge")}
            </span>
          </div>
          <Field
            label={t("videoUrl")}
            hint={t("videoUrlHint")}
            error={tr(errors.videoUrl?.message)}
          >
            <Input
              type="url"
              dir="ltr"
              placeholder="https://youtube.com/watch?v=…"
              className="h-11 rounded-xl"
              {...form.register("videoUrl", {
                setValueAs: (v: string) => (v === "" ? null : v),
              })}
            />
          </Field>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  hint,
  error,
  action,
  children,
}: {
  label: string
  hint?: string
  error?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {action}
      </div>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

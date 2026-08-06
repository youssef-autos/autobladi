"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { useLocale } from "next-intl"
import { useTranslations } from "next-intl"

import { GenerateDescriptionButton } from "@/components/ai/GenerateDescriptionButton"
import { Checkbox } from "@/components/ui/checkbox"
import { Field } from "@/components/ui/Field"
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
}

export function Step2DescriptionPrice({ brands, models }: Props) {
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
  const contactPhone = form.watch("contactPhone")
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

  // "Same as phone" for WhatsApp — avoids retyping an identical number.
  const [sameAsPhone, setSameAsPhone] = useState(false)
  const { setValue } = form
  useEffect(() => {
    if (sameAsPhone) {
      setValue("contactWhatsapp", contactPhone || null, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [sameAsPhone, contactPhone, setValue])

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

      <Field label={t("carTitle")} help={t("titleHint")} error={tr(errors.title?.message)}>
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

        <Controller
          control={form.control}
          name="priceOnRequest"
          render={({ field }) => (
            <div className="md:col-span-2 space-y-1.5">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
                <span className="text-sm font-medium text-foreground">
                  {t("priceOnRequest")}
                </span>
              </label>
              <p className="text-xs text-muted-foreground">{t("priceOnRequestHint")}</p>
            </div>
          )}
        />

        <Field label={t("contactPhone")} error={tr(errors.contactPhone?.message)}>
          <Input
            type="tel"
            placeholder={t("phonePlaceholder")}
            className="h-11 rounded-xl"
            {...form.register("contactPhone")}
          />
        </Field>

        <div className="space-y-1.5">
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{t("contactWhatsapp")}</span>
            <label className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground cursor-pointer">
              <Checkbox
                checked={sameAsPhone}
                onCheckedChange={(v) => setSameAsPhone(v === true)}
              />
              {t("sameAsPhone")}
            </label>
          </span>
          <Input
            type="tel"
            placeholder={t("phonePlaceholder")}
            disabled={sameAsPhone}
            className={cn("h-11 rounded-xl", sameAsPhone && "opacity-60")}
            {...form.register("contactWhatsapp", {
              setValueAs: (v: string) => (v === "" ? null : v),
            })}
          />
          {tr(errors.contactWhatsapp?.message) ? (
            <span className="block text-xs text-destructive">
              {tr(errors.contactWhatsapp?.message)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}


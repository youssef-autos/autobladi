"use client"

import { Controller, useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"

import { ImageUploader } from "@/components/forms/AjouterAnnonce/ImageUploader"
import type { AnnonceFormValues } from "@/lib/validations/annonce"

export function Step3Images() {
  const t = useTranslations("ajouter.step3")
  const form = useFormContext<AnnonceFormValues>()
  const errors = form.formState.errors

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="font-display text-2xl font-bold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Controller
        control={form.control}
        name="images"
        render={({ field }) => (
          <ImageUploader
            images={field.value.map((img, i) => ({
              id: `${i}-${img.url}`,
              url: img.url,
              thumbnail_url: img.thumbnail_url,
              is_main: img.is_main,
            }))}
            onChange={(images) =>
              field.onChange(
                images.map((img) => ({
                  url: img.url,
                  thumbnail_url: img.thumbnail_url,
                  is_main: img.is_main,
                })),
              )
            }
          />
        )}
      />

      {errors.images && (
        <p className="text-sm text-destructive">
          {errors.images.message?.startsWith("ajouter.")
            ? t("tooSmall")
            : errors.images.message}
        </p>
      )}
    </div>
  )
}

"use client"

import { Controller, useFormContext } from "react-hook-form"
import { Video } from "lucide-react"
import { useTranslations } from "next-intl"

import { ImageUploader } from "@/components/forms/AjouterAnnonce/ImageUploader"
import { Input } from "@/components/ui/input"
import type { AnnonceFormValues } from "@/lib/validations/annonce"

type Props = {
  /** Pro accounts unlock the promo-video field. */
  isPro?: boolean
}

export function Step3Images({ isPro = false }: Props) {
  const t = useTranslations("ajouter.step3")
  const tStep2 = useTranslations("ajouter.step2")
  const tValidation = useTranslations("ajouter.validation")
  const form = useFormContext<AnnonceFormValues>()
  const errors = form.formState.errors

  const tr = (key?: string) =>
    key?.startsWith("ajouter.validation.")
      ? tValidation(key.slice("ajouter.validation.".length))
      : (key ?? "")

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

      {/* Promo video — professionals only */}
      {isPro && (
        <div className="rounded-xl border border-moroccan-gold-500/30 bg-moroccan-gold-50/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-moroccan-gold-500/15 text-moroccan-gold-600">
              <Video className="size-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-moroccan-gold-700">
              {tStep2("proBadge")}
            </span>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {tStep2("videoUrl")}
            </label>
            <Input
              type="url"
              dir="ltr"
              placeholder="https://youtube.com/watch?v=…"
              className="h-11 rounded-xl"
              {...form.register("videoUrl", {
                setValueAs: (v: string) => (v === "" ? null : v),
              })}
            />
            {errors.videoUrl ? (
              <p className="text-xs text-destructive">{tr(errors.videoUrl.message)}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{tStep2("videoUrlHint")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

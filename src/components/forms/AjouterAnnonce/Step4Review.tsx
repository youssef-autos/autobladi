"use client"

import Image from "next/image"
import { Controller, useFormContext } from "react-hook-form"
import { Calendar, Camera, Fuel, Gauge, MapPin } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { PriceTag } from "@/components/ui/PriceTag"
import { equipmentLabel } from "@/lib/equipments"
import { colorLabel, origineLabel, transmissionLabel } from "@/lib/vehicle-options"
import { formatMileage } from "@/lib/utils/format"
import type { Brand, CarModel, City } from "@/lib/queries/home"
import type { AnnonceFormValues } from "@/lib/validations/annonce"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  brands: Brand[]
  models: CarModel[]
  cities: City[]
}

export function Step4Review({ brands, models, cities }: Props) {
  const t = useTranslations("ajouter.step4")
  const tStep1 = useTranslations("ajouter.step1")
  const tStep2 = useTranslations("ajouter.step2")
  const tValidation = useTranslations("ajouter.validation")
  const tFuel = useTranslations("annonces.fuel")
  const locale = useLocale() as Locale
  const form = useFormContext<AnnonceFormValues>()
  const v = form.watch()
  const errors = form.formState.errors

  const brand = brands.find((b) => b.id === v.brandId)
  const model = models.find((m) => m.id === v.modelId)
  const city = cities.find((c) => c.id === v.cityId)
  const cityName = city ? (locale === "ar" ? city.name_ar : city.name_fr) : "—"
  const mainImage = v.images.find((img) => img.is_main) ?? v.images[0]

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="font-display text-2xl font-bold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary card */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-3">{t("vehicleInfo")}</h3>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <Row k={tStep1("brand")} val={brand?.name} />
              <Row k={tStep1("model")} val={model?.name} />
              <Row k={tStep1("city")} val={cityName} />
              <Row k={tStep1("year")} val={v.year} />
              {v.condition === "occasion" && (
                <Row
                  k={tStep1("mileage")}
                  val={v.mileage != null ? formatMileage(v.mileage, locale) : "—"}
                />
              )}
              {v.color && (
                <Row k={tStep1("color")} val={colorLabel(v.color, locale)} />
              )}
              {v.origine && (
                <Row k={tStep1("origine")} val={origineLabel(v.origine, locale)} />
              )}
              {v.fuelType && <Row k={tStep1("fuelType")} val={tFuel(v.fuelType)} />}
              {v.transmission && (
                <Row k={tStep1("transmission")} val={transmissionLabel(v.transmission, locale)} />
              )}
              {v.doors != null && <Row k={tStep1("doors")} val={v.doors} />}
              {v.seats != null && <Row k={tStep1("seats")} val={v.seats} />}
              {v.enginePower != null && <Row k={tStep1("enginePower")} val={`${v.enginePower} ch`} />}
              {v.engineSize && <Row k={tStep1("engineSize")} val={v.engineSize} />}
              {v.firstOwner != null && (
                <Row k={tStep1("firstOwner")} val={v.firstOwner ? tStep1("yes") : tStep1("no")} />
              )}
              {v.accidentFree != null && (
                <Row k={tStep1("accidentFree")} val={v.accidentFree ? tStep1("yes") : tStep1("no")} />
              )}
            </dl>

            {v.options.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/60">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {tStep1("optionsTitle")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {v.options.map((opt) => (
                    <Badge key={opt} variant="outline" className="text-xs">
                      {equipmentLabel(opt, locale)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-3">{t("descPrice")}</h3>
            <p className="font-display text-xl font-bold text-foreground">{v.title}</p>
            <p className="mt-2 text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">
              {v.description || "—"}
            </p>
            <div className="mt-4 flex items-baseline gap-3">
              <PriceTag price={v.price} size="lg" />
              {v.negotiable && (
                <span className="text-xs text-muted-foreground">
                  · {tStep2("negotiable")}
                </span>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-semibold text-foreground mb-2">
              {t("imagesCount", { count: v.images.length })}
            </h3>
            <ul className="grid grid-cols-4 gap-2">
              {v.images.slice(0, 8).map((img, i) => (
                <li
                  key={img.url}
                  className="relative aspect-[4/3] rounded-lg overflow-hidden bg-moroccan-sand-50"
                >
                  <Image src={img.thumbnail_url} alt="" fill sizes="120px" className="object-cover" />
                  {img.is_main && (
                    <span className="absolute top-1 start-1 size-2 rounded-full bg-moroccan-gold-500 ring-2 ring-white" />
                  )}
                  {i === 7 && v.images.length > 8 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white text-xs font-semibold">
                      +{v.images.length - 8}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Preview card */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("previewTitle")}
          </p>
          <article className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            <div className="relative aspect-[4/3] bg-moroccan-sand-50">
              {mainImage ? (
                <Image
                  src={mainImage.url}
                  alt={v.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-moroccan-sand-200">
                  <Camera className="size-10" strokeWidth={1.2} aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <h4 className="font-semibold line-clamp-1">{v.title || "—"}</h4>
              <PriceTag price={v.price} size="lg" />
              <ul className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-muted-foreground">
                <li className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-moroccan-gold-500" />
                  {v.year || "—"}
                </li>
                {v.condition === "occasion" && v.mileage != null && (
                  <li className="inline-flex items-center gap-1.5">
                    <Gauge className="size-3.5 text-moroccan-gold-500" />
                    {formatMileage(v.mileage, locale)}
                  </li>
                )}
                {v.fuelType && (
                  <li className="inline-flex items-center gap-1.5">
                    <Fuel className="size-3.5 text-moroccan-gold-500" />
                    {tFuel(v.fuelType)}
                  </li>
                )}
                <li className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-moroccan-gold-500" />
                  {cityName}
                </li>
              </ul>
            </div>
          </article>
        </div>
      </div>

      {/* Terms */}
      <Controller
        control={form.control}
        name="acceptTerms"
        render={({ field }) => (
          <label
            className={cn(
              "flex items-start gap-3 rounded-2xl border bg-card p-4 cursor-pointer",
              field.value
                ? "border-moroccan-gold-500 bg-moroccan-gold-50/40"
                : "border-border",
            )}
          >
            <Checkbox
              checked={field.value}
              onCheckedChange={(c) => field.onChange(c === true)}
            />
            <span className="text-sm text-foreground/90 leading-relaxed">
              {t("acceptTerms")}
            </span>
          </label>
        )}
      />
      {errors.acceptTerms?.message && (
        <p className="text-sm text-destructive">
          {errors.acceptTerms.message.startsWith("ajouter.validation.")
            ? tValidation(
                errors.acceptTerms.message.slice("ajouter.validation.".length),
              )
            : errors.acceptTerms.message}
        </p>
      )}
    </div>
  )
}

function Row({ k, val }: { k: string; val: string | number | null | undefined }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-foreground text-end">{val ?? "—"}</dd>
    </>
  )
}

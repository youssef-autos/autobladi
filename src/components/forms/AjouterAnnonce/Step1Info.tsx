"use client"

import { Controller, useFormContext } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"

import { EQUIPMENT_GROUPS } from "@/lib/equipments"
import { ORIGINES, origineLabel } from "@/lib/vehicle-options"
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Brand, CarModel, City, Secteur } from "@/lib/queries/home"
import type { AnnonceFormValues } from "@/lib/validations/annonce"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  brands: Brand[]
  models: CarModel[]
  cities: City[]
  secteurs: Secteur[]
}

const FUEL = ["essence", "diesel", "hybrid", "electric", "lpg"] as const
const DOORS = [2, 3, 4, 5, 6]
const SEATS = [2, 4, 5, 7, 9]

export function Step1Vehicle({
  brands,
  models,
  cities,
  secteurs,
}: Props) {
  const t = useTranslations("ajouter.step1")
  const tValidation = useTranslations("ajouter.validation")
  const tFuel = useTranslations("annonces.fuel")
  const locale = useLocale() as Locale
  const form = useFormContext<AnnonceFormValues>()
  const errors = form.formState.errors
  const condition = form.watch("condition")
  const selectedBrandId = form.watch("brandId")
  const selectedCityId = form.watch("cityId")

  const availableModels = models.filter((m) => m.brand_id === selectedBrandId)
  const availableSecteurs = secteurs.filter((s) => s.city_id === selectedCityId)

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

      {/* Condition */}
      <Field label={t("condition")}>
        <Controller
          control={form.control}
          name="condition"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={(v) => v && field.onChange(v)}
              className="grid grid-cols-2 gap-3 max-w-md"
            >
              {(["occasion", "neuf"] as const).map((c) => (
                <Label
                  key={c}
                  htmlFor={`cond-${c}`}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border bg-background px-4 py-3 cursor-pointer",
                    field.value === c
                      ? "border-moroccan-red-500 bg-moroccan-red-50/40"
                      : "border-border",
                  )}
                >
                  <RadioGroupItem value={c} id={`cond-${c}`} />
                  <span className="text-sm font-medium">
                    {c === "occasion" ? t("conditionUsed") : t("conditionNew")}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brand */}
        <Field label={t("brand")} error={tr(errors.brandId?.message)}>
          <Controller
            control={form.control}
            name="brandId"
            render={({ field }) => (
              <Combobox
                items={brands.map((b) => ({ value: b.id, label: b.name, logo: b.logo_url }))}
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v)
                  form.setValue("modelId", "")
                }}
              />
            )}
          />
        </Field>

        {/* Model */}
        <Field label={t("model")} error={tr(errors.modelId?.message)}>
          <Controller
            control={form.control}
            name="modelId"
            render={({ field }) => (
              <Combobox
                items={availableModels.map((m) => ({ value: m.id, label: m.name }))}
                value={field.value}
                onValueChange={(v) => field.onChange(v)}
                disabled={!selectedBrandId}
              />
            )}
          />
        </Field>

        {/* City */}
        <Field label={t("city")} error={tr(errors.cityId?.message)}>
          <Controller
            control={form.control}
            name="cityId"
            render={({ field }) => (
              <Combobox
                items={cities.map((c) => ({
                  value: c.id,
                  label: locale === "ar" ? c.name_ar : c.name_fr,
                }))}
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v)
                  form.setValue("secteurId", "")
                }}
              />
            )}
          />
        </Field>

        {/* Secteur — only when the selected city has secteurs */}
        {availableSecteurs.length > 0 && (
          <Field label={t("secteur")} error={tr(errors.secteurId?.message)}>
            <Controller
              control={form.control}
              name="secteurId"
              render={({ field }) => (
                <Combobox
                  items={availableSecteurs.map((s) => ({
                    value: s.id,
                    label: locale === "ar" ? s.name_ar : s.name_fr,
                  }))}
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                  placeholder={t("secteurPlaceholder")}
                  emptyText={t("secteurPlaceholder")}
                />
              )}
            />
          </Field>
        )}

        {/* Year */}
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

        {/* Mileage — only for used */}
        {condition === "occasion" && (
          <Field label={t("mileage")} error={tr(errors.mileage?.message)}>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={t("mileagePlaceholder")}
              className="h-11 rounded-xl"
              {...form.register("mileage", {
                setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
              })}
            />
          </Field>
        )}

        {/* Fuel */}
        <Field label={t("fuelType")} error={tr(errors.fuelType?.message)}>
          <Controller
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <TriggerLabel
                    value={field.value}
                    label={field.value ? tFuel(field.value) : undefined}
                  />
                </SelectTrigger>
                <SelectContent>
                  {FUEL.map((f) => (
                    <SelectItem key={f} value={f}>
                      {tFuel(f)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* Transmission */}
        <Field label={t("transmission")} error={tr(errors.transmission?.message)}>
          <Controller
            control={form.control}
            name="transmission"
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <TriggerLabel
                    value={field.value}
                    label={
                      field.value === "automatique"
                        ? t("transmissionAuto")
                        : field.value === "manuelle"
                          ? t("transmissionManual")
                          : undefined
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manuelle">{t("transmissionManual")}</SelectItem>
                  <SelectItem value="automatique">{t("transmissionAuto")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* Doors */}
        <Field label={t("doors")} error={tr(errors.doors?.message)}>
          <Controller
            control={form.control}
            name="doors"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {DOORS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* Seats */}
        <Field label={t("seats")} error={tr(errors.seats?.message)}>
          <Controller
            control={form.control}
            name="seats"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {SEATS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* Color */}
        <Field label={`${t("color")} ${t("optional")}`} error={tr(errors.color?.message)}>
          <Input
            placeholder={t("colorPlaceholder")}
            className="h-11 rounded-xl"
            {...form.register("color")}
          />
        </Field>

        {/* Engine Power */}
        <Field label={t("enginePower")} error={tr(errors.enginePower?.message)}>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            className="h-11 rounded-xl"
            {...form.register("enginePower", {
              setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
            })}
          />
        </Field>

        {/* Engine Size */}
        <Field label={t("engineSize")} error={tr(errors.engineSize?.message)}>
          <Input
            placeholder={t("engineSizePlaceholder")}
            className="h-11 rounded-xl"
            {...form.register("engineSize", {
              setValueAs: (v: string) => (v === "" ? null : v),
            })}
          />
        </Field>

        {/* Origine du véhicule */}
        <Field label={t("origine")} error={tr(errors.origine?.message)}>
          <Controller
            control={form.control}
            name="origine"
            render={({ field }) => (
              <Select
                value={field.value ?? undefined}
                onValueChange={(v) => field.onChange(v || null)}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <span
                    className={cn(
                      "flex-1 text-start text-sm truncate",
                      field.value ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {origineLabel(field.value, locale) ?? "—"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {ORIGINES.map((o) => (
                    <SelectItem key={o.key} value={o.key}>
                      {locale === "ar" ? o.ar : o.fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Toggle
          label={t("firstOwner")}
          name="firstOwner"
          form={form}
        />
        <Toggle
          label={t("accidentFree")}
          name="accidentFree"
          form={form}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-foreground mb-3">
          {t("optionsTitle")}
        </legend>
        <Controller
          control={form.control}
          name="options"
          render={({ field }) => (
            <Accordion className="flex flex-col gap-3">
              {EQUIPMENT_GROUPS.map((group) => {
                const GroupIcon = group.icon
                const selectedCount = group.items.filter((i) =>
                  field.value.includes(i.key),
                ).length
                return (
                  <AccordionItem key={group.key} value={group.key}>
                    <AccordionTrigger>
                      <span className="inline-flex items-center gap-2.5">
                        <span className="inline-flex size-7 items-center justify-center rounded-md bg-moroccan-mint-500/10 text-moroccan-mint-500">
                          <GroupIcon className="size-4" aria-hidden="true" />
                        </span>
                        {locale === "ar" ? group.ar : group.fr}
                        {selectedCount > 0 && (
                          <span className="text-xs font-normal text-moroccan-mint-500">
                            ({selectedCount})
                          </span>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionPanel>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {group.items.map((item) => {
                          const Icon = item.icon
                          const checked = field.value.includes(item.key)
                          return (
                            <li key={item.key}>
                              <Label
                                htmlFor={`opt-${item.key}`}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg border bg-background px-3 py-2 cursor-pointer text-sm transition-colors",
                                  checked
                                    ? "border-moroccan-mint-500 bg-moroccan-mint-500/5"
                                    : "border-border hover:bg-moroccan-sand-50",
                                )}
                              >
                                <Checkbox
                                  id={`opt-${item.key}`}
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    const next =
                                      v === true
                                        ? [...field.value, item.key]
                                        : field.value.filter((o) => o !== item.key)
                                    field.onChange(next)
                                  }}
                                />
                                <Icon
                                  className={cn(
                                    "size-4 shrink-0",
                                    checked
                                      ? "text-moroccan-mint-500"
                                      : "text-muted-foreground",
                                  )}
                                  aria-hidden="true"
                                />
                                <span className="flex-1">
                                  {locale === "ar" ? item.ar : item.fr}
                                </span>
                              </Label>
                            </li>
                          )
                        })}
                      </ul>
                    </AccordionPanel>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        />
      </fieldset>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  )
}

/**
 * base-ui's <SelectValue> renders the raw `value` (e.g. a UUID) rather than the
 * selected item's text — so we render a computed label inside the trigger.
 */
function TriggerLabel({
  value,
  label,
}: {
  value?: string | number | null
  label?: string | null
}) {
  return (
    <span
      className={cn(
        "flex-1 text-start text-sm truncate",
        value ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label || "—"}
    </span>
  )
}

function Toggle({
  label,
  name,
  form,
}: {
  label: string
  name: "firstOwner" | "accidentFree"
  form: ReturnType<typeof useFormContext<AnnonceFormValues>>
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 cursor-pointer">
          <span className="text-sm font-medium">{label}</span>
          <Switch
            checked={field.value}
            onCheckedChange={(v) => field.onChange(v === true)}
          />
        </label>
      )}
    />
  )
}

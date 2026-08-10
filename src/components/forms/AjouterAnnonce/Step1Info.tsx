"use client"

import { Controller, useFormContext } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"

import { EQUIPMENT_GROUPS } from "@/lib/equipments"
import { MAX_YEAR, MIN_YEAR } from "@/lib/validations/annonce"
import {
  COLORS,
  ORIGINES,
  TRANSMISSIONS,
  colorLabel,
  origineLabel,
  transmissionLabel,
} from "@/lib/vehicle-options"
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
import { Field } from "@/components/ui/Field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
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

// Most recent first — that's the model year sellers are overwhelmingly listing.
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i)

// Matches the annonces.fuel_type Postgres enum.
const FUEL_TYPES = ["essence", "diesel", "hybrid", "electric", "lpg"] as const

// Matches the doors/seats bounds in step1Schema.
const DOORS_OPTIONS = [2, 3, 4, 5, 6, 7, 8]
const SEATS_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9]

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
  const selectPlaceholder = t("selectPlaceholder")

  const tr = (key?: string) =>
    key?.startsWith("ajouter.validation.")
      ? tValidation(key.slice("ajouter.validation.".length))
      : (key ?? "")

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h2 className="font-display text-2xl font-bold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* Condition — first because it decides whether mileage is asked below */}
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

      {/* Informations principales — identity, location, year/mileage, look */}
      <section className="space-y-4">
        <SectionHeading title={t("sections.mainInfo")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Brand */}
          <Field label={t("brand")} required error={tr(errors.brandId?.message)}>
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
                  placeholder={selectPlaceholder}
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
                  placeholder={selectPlaceholder}
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
                  placeholder={selectPlaceholder}
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
          <Field label={t("year")} required error={tr(errors.year?.message)}>
            <Controller
              control={form.control}
              name="year"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <TriggerLabel
                      value={field.value || null}
                      label={field.value ? String(field.value) : undefined}
                      placeholder={selectPlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{selectPlaceholder}</SelectItem>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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

          {/* Color */}
          <Field label={t("color")} error={tr(errors.color?.message)}>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={(v) => field.onChange(v ?? "")}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <TriggerLabel
                      value={field.value}
                      label={field.value ? colorLabel(field.value, locale) : undefined}
                      placeholder={selectPlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{selectPlaceholder}</SelectItem>
                    {COLORS.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {locale === "ar" ? c.ar : c.fr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Origine du véhicule */}
          <Field label={t("origine")} error={tr(errors.origine?.message)}>
            <Controller
              control={form.control}
              name="origine"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || null)}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <span
                      className={cn(
                        "flex-1 text-start text-sm truncate",
                        field.value ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {origineLabel(field.value, locale) ?? selectPlaceholder}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{selectPlaceholder}</SelectItem>
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
      </section>

      {/* Moteur & transmission */}
      <section className="space-y-4">
        <SectionHeading title={t("sections.motor")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Carburant */}
          <Field label={t("fuelType")}>
            <Controller
              control={form.control}
              name="fuelType"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) =>
                    field.onChange((v || null) as AnnonceFormValues["fuelType"])
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <TriggerLabel
                      value={field.value}
                      label={field.value ? tFuel(field.value) : undefined}
                      placeholder={selectPlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{selectPlaceholder}</SelectItem>
                    {FUEL_TYPES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {tFuel(f)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Boîte de vitesses */}
          <Field label={t("transmission")}>
            <Controller
              control={form.control}
              name="transmission"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) =>
                    field.onChange((v || null) as AnnonceFormValues["transmission"])
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <TriggerLabel
                      value={field.value}
                      label={field.value ? transmissionLabel(field.value, locale) : undefined}
                      placeholder={selectPlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{selectPlaceholder}</SelectItem>
                    {TRANSMISSIONS.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key}>
                        {locale === "ar" ? opt.ar : opt.fr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Portes */}
          <Field label={t("doors")}>
            <Controller
              control={form.control}
              name="doors"
              render={({ field }) => (
                <Select
                  value={field.value != null ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <TriggerLabel
                      value={field.value}
                      label={field.value != null ? String(field.value) : undefined}
                      placeholder={selectPlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{selectPlaceholder}</SelectItem>
                    {DOORS_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Places */}
          <Field label={t("seats")}>
            <Controller
              control={form.control}
              name="seats"
              render={({ field }) => (
                <Select
                  value={field.value != null ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <TriggerLabel
                      value={field.value}
                      label={field.value != null ? String(field.value) : undefined}
                      placeholder={selectPlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{selectPlaceholder}</SelectItem>
                    {SEATS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
      </section>

      {/* Historique du véhicule */}
      <section className="space-y-4">
        <SectionHeading title={t("sections.history")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            control={form.control}
            name="firstOwner"
            render={({ field }) => (
              <TriStateField
                name="firstOwner"
                label={t("firstOwner")}
                value={field.value}
                onChange={field.onChange}
                unspecifiedLabel={t("unspecified")}
                yesLabel={t("yes")}
                noLabel={t("no")}
              />
            )}
          />
          <Controller
            control={form.control}
            name="accidentFree"
            render={({ field }) => (
              <TriStateField
                name="accidentFree"
                label={t("accidentFree")}
                value={field.value}
                onChange={field.onChange}
                unspecifiedLabel={t("unspecified")}
                yesLabel={t("yes")}
                noLabel={t("no")}
              />
            )}
          />
        </div>
      </section>

      {/* Équipements */}
      <fieldset className="space-y-4">
        <SectionHeading title={t("optionsTitle")} as="legend" />
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

function SectionHeading({
  title,
  as: Tag = "h3",
}: {
  title: string
  as?: "h3" | "legend"
}) {
  return (
    <Tag className="block text-base font-semibold text-foreground pb-2 border-b border-border">
      {title}
    </Tag>
  )
}

/**
 * Yes / No / unspecified — for boolean-nullable facts (first owner, accident
 * history) where defaulting a silent "No" would misrepresent the car.
 */
function TriStateField({
  name,
  label,
  value,
  onChange,
  unspecifiedLabel,
  yesLabel,
  noLabel,
}: {
  name: string
  label: string
  value: boolean | null
  onChange: (value: boolean | null) => void
  unspecifiedLabel: string
  yesLabel: string
  noLabel: string
}) {
  const current = value === null ? "unset" : value ? "yes" : "no"
  const options = [
    ["unset", unspecifiedLabel],
    ["yes", yesLabel],
    ["no", noLabel],
  ] as const

  return (
    <Field label={label}>
      <RadioGroup
        value={current}
        onValueChange={(v) => v && onChange(v === "unset" ? null : v === "yes")}
        className="grid grid-cols-3 gap-2"
      >
        {options.map(([v, text]) => (
          <Label
            key={v}
            htmlFor={`${name}-${v}`}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border bg-background px-3 py-2.5 cursor-pointer text-sm font-medium",
              current === v
                ? "border-moroccan-red-500 bg-moroccan-red-50/40"
                : "border-border",
            )}
          >
            <RadioGroupItem value={v} id={`${name}-${v}`} />
            {text}
          </Label>
        ))}
      </RadioGroup>
    </Field>
  )
}


/**
 * base-ui's <SelectValue> renders the raw `value` (e.g. a UUID) rather than the
 * selected item's text — so we render a computed label inside the trigger.
 */
function TriggerLabel({
  value,
  label,
  placeholder = "—",
}: {
  value?: string | number | null
  label?: string | null
  placeholder?: string
}) {
  return (
    <span
      className={cn(
        "flex-1 text-start text-sm truncate",
        value ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label || placeholder}
    </span>
  )
}

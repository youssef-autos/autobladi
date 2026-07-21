"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Search, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useQueryStates } from "nuqs"

import {
  CONDITION_VALUES,
  FUEL_VALUES,
  TRANSMISSION_VALUES,
  annoncesSearchParams,
} from "@/components/annonces/searchParams"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { transmissionLabel } from "@/lib/vehicle-options"
import type { Brand, CarModel, City, Secteur } from "@/lib/queries/home"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  brands: Brand[]
  models: CarModel[]
  cities: City[]
  secteurs: Secteur[]
  className?: string
  onApply?: () => void
}

export function FiltersSidebar({
  brands,
  models,
  cities,
  secteurs,
  className,
  onApply,
}: Props) {
  const t = useTranslations("annonces")
  const locale = useLocale() as Locale
  const [filters, setFilters] = useQueryStates(annoncesSearchParams, {
    shallow: false,
  })
  const [brandQuery, setBrandQuery] = useState("")
  const [cityQuery, setCityQuery] = useState("")

  // Locale-aware sort + search. The DB returns brands by `order_index` and
  // cities by name_fr, so we always re-sort client-side to make the filter
  // predictable regardless of how the data was ordered upstream.
  const collator = useMemo(
    () => new Intl.Collator(locale, { sensitivity: "base" }),
    [locale],
  )

  const sortedBrands = useMemo(
    () => [...brands].sort((a, b) => collator.compare(a.name, b.name)),
    [brands, collator],
  )

  const sortedCities = useMemo(
    () =>
      [...cities].sort((a, b) =>
        collator.compare(
          locale === "ar" ? a.name_ar : a.name_fr,
          locale === "ar" ? b.name_ar : b.name_fr,
        ),
      ),
    [cities, collator, locale],
  )

  /**
   * Filters + reorders entries while the user is typing:
   *  - items whose display name STARTS WITH the query come first
   *  - items where the query appears anywhere come after
   *  - empty query falls back to the alphabetically sorted list
   * Case- and diacritic-insensitive via `toLocaleLowerCase`.
   */
  function searchAndOrder<T>(
    items: T[],
    query: string,
    getName: (item: T) => string,
  ): T[] {
    const q = query.trim().toLocaleLowerCase(locale)
    if (!q) return items
    const startsWith: T[] = []
    const contains: T[] = []
    for (const item of items) {
      const name = getName(item).toLocaleLowerCase(locale)
      if (name.startsWith(q)) startsWith.push(item)
      else if (name.includes(q)) contains.push(item)
    }
    return [...startsWith, ...contains]
  }

  const filteredBrands = useMemo(
    () => searchAndOrder(sortedBrands, brandQuery, (b) => b.name),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandQuery, sortedBrands, locale],
  )

  const filteredCities = useMemo(
    () =>
      searchAndOrder(sortedCities, cityQuery, (c) =>
        locale === "ar" ? c.name_ar : c.name_fr,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cityQuery, sortedCities, locale],
  )

  // Models grouped by brand_id — used for inline accordion in brand filter
  const modelsByBrandId = useMemo(() => {
    const map = new Map<string, CarModel[]>()
    for (const m of models) {
      if (!m.is_active) continue
      const arr = map.get(m.brand_id) ?? []
      arr.push(m)
      map.set(m.brand_id, arr)
    }
    return map
  }, [models])

  // Secteurs grouped by city_id — used for inline accordion
  const secteursByCityId = useMemo(() => {
    const map = new Map<string, typeof secteurs>()
    for (const s of secteurs) {
      const arr = map.get(s.city_id) ?? []
      arr.push(s)
      map.set(s.city_id, arr)
    }
    return map
  }, [secteurs])

  const toggleArray = (key: "brand" | "model" | "city" | "secteur", value: string) => {
    const current = filters[key] as string[]
    const isRemoving = current.includes(value)
    const next = isRemoving
      ? current.filter((v) => v !== value)
      : [...current, value]

    if (key === "brand" && isRemoving) {
      // When a brand is unchecked, also remove its models from the selection
      const brand = brands.find((b) => b.slug === value)
      if (brand) {
        const brandModelSlugs = new Set(
          (modelsByBrandId.get(brand.id) ?? []).map((m) => m.slug),
        )
        const cleanedModels = filters.model.filter((s) => !brandModelSlugs.has(s))
        setFilters({ brand: next, model: cleanedModels, page: 1 })
        return
      }
    }

    if (key === "city" && isRemoving) {
      // When a city is unchecked, also remove its secteurs from the selection
      const city = cities.find((c) => c.slug === value)
      if (city) {
        const citySecteurSlugs = new Set(
          (secteursByCityId.get(city.id) ?? []).map((s) => s.slug),
        )
        const cleanedSecteurs = filters.secteur.filter((s) => !citySecteurSlugs.has(s))
        setFilters({ city: next, secteur: cleanedSecteurs, page: 1 })
        return
      }
    }

    setFilters({ [key]: next, page: 1 })
  }

  const toggleFuel = (value: string) => {
    const current = filters.fuel
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setFilters({ fuel: next, page: 1 })
  }

  const clearAll = () => {
    setFilters({
      q: "",
      condition: null,
      brand: [],
      model: [],
      city: [],
      secteur: [],
      priceMin: null,
      priceMax: null,
      yearMin: null,
      yearMax: null,
      mileageMin: null,
      mileageMax: null,
      fuel: [],
      transmission: null,
      color: "",
      doors: [],
      options: [],
      page: 1,
    })
  }

  return (
    <aside className={cn("flex flex-col gap-5", className)}>
      <header className="flex items-center justify-between">
        <h2 className="font-semibold text-base">{t("filters")}</h2>
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 p-2 -m-2 text-xs text-moroccan-red-500 hover:underline"
        >
          <X className="size-3.5" />
          {t("clearFilters")}
        </button>
      </header>

      {/* Condition */}
      <FilterGroup label={t("fields.condition")}>
        <RadioGroup
          value={filters.condition ?? ""}
          onValueChange={(v) =>
            setFilters({
              condition: (v || null) as (typeof CONDITION_VALUES)[number] | null,
              page: 1,
            })
          }
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
          {CONDITION_VALUES.map((c) => (
            <label
              key={c}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 cursor-pointer text-sm",
                filters.condition === c && "border-moroccan-red-500/40 bg-moroccan-red-50/30",
              )}
            >
              <RadioGroupItem value={c} id={`cond-${c}`} />
              <span>{t(c === "occasion" ? "fields.conditionUsed" : "fields.conditionNew")}</span>
            </label>
          ))}
        </RadioGroup>
      </FilterGroup>

      {/* Brand + inline models accordion */}
      <FilterGroup label={t("fields.brand")}>
        <SearchInput
          value={brandQuery}
          onChange={setBrandQuery}
          placeholder={t("searchPlaceholder")}
        />
        <ScrollList>
          {filteredBrands.map((brand) => {
            const isChecked = filters.brand.includes(brand.slug)
            const brandModels = modelsByBrandId.get(brand.id) ?? []
            return (
              <div key={brand.id}>
                {/* Brand row — logo + name + collapse arrow */}
                <label
                  htmlFor={`brand-${brand.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-moroccan-sand-50 cursor-pointer text-sm"
                >
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleArray("brand", brand.slug)}
                  />
                  {/* Logo */}
                  {brand.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.logo_url}
                      alt=""
                      loading="eager"
                      className="size-6 object-contain shrink-0"
                    />
                  ) : (
                    <span className="size-6 shrink-0 inline-flex items-center justify-center rounded bg-moroccan-sand-50 text-[10px] font-bold text-muted-foreground">
                      {brand.name[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="flex-1 truncate">{brand.name}</span>
                  {/* collapse arrow shown when checked and has models */}
                  {isChecked && brandModels.length > 0 && (
                    <ChevronUp className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  )}
                  {!isChecked && brandModels.length > 0 && (
                    <ChevronDown className="size-3.5 text-muted-foreground/40 shrink-0" aria-hidden="true" />
                  )}
                </label>

                {/* Models — shown inline when brand is selected */}
                {isChecked && brandModels.length > 0 && (
                  <div className="ms-8 mt-0.5 space-y-0.5 border-s-2 border-moroccan-sand-50 ps-2">
                    {brandModels.map((m) => (
                      <CheckRow
                        key={m.id}
                        id={`model-${m.id}`}
                        label={m.name}
                        checked={filters.model.includes(m.slug)}
                        onCheck={() => toggleArray("model", m.slug)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </ScrollList>
      </FilterGroup>

      {/* City + inline secteurs accordion */}
      <FilterGroup label={t("fields.city")}>
        <SearchInput
          value={cityQuery}
          onChange={setCityQuery}
          placeholder={t("searchPlaceholder")}
        />
        <ScrollList>
          {filteredCities.map((city) => {
            const isChecked = filters.city.includes(city.slug)
            const citySecteurs = secteursByCityId.get(city.id) ?? []
            const cityLabel = locale === "ar" ? city.name_ar : city.name_fr
            return (
              <div key={city.id}>
                {/* City row */}
                <label
                  htmlFor={`city-${city.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-moroccan-sand-50 cursor-pointer text-sm"
                >
                  <Checkbox
                    id={`city-${city.id}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleArray("city", city.slug)}
                  />
                  <span className="flex-1 truncate">{cityLabel}</span>
                  {isChecked && citySecteurs.length > 0 && (
                    <ChevronUp className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  )}
                  {!isChecked && citySecteurs.length > 0 && (
                    <ChevronDown className="size-3.5 text-muted-foreground/40 shrink-0" aria-hidden="true" />
                  )}
                </label>

                {/* Secteurs — shown inline when city is selected */}
                {isChecked && citySecteurs.length > 0 && (
                  <div className="ms-6 mt-0.5 space-y-0.5 border-s-2 border-moroccan-sand-50 ps-2">
                    {citySecteurs.map((s) => (
                      <CheckRow
                        key={s.id}
                        id={`secteur-${s.id}`}
                        label={locale === "ar" ? s.name_ar : s.name_fr}
                        checked={filters.secteur.includes(s.slug)}
                        onCheck={() => toggleArray("secteur", s.slug)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </ScrollList>
      </FilterGroup>

      {/* Price */}
      <FilterGroup label={t("fields.price")}>
        <RangeInputs
          min={filters.priceMin}
          max={filters.priceMax}
          step={1000}
          fromLabel={t("fields.from")}
          toLabel={t("fields.to")}
          onChange={(min, max) => setFilters({ priceMin: min, priceMax: max, page: 1 })}
        />
      </FilterGroup>

      {/* Year */}
      <FilterGroup label={t("fields.year")}>
        <RangeInputs
          min={filters.yearMin}
          max={filters.yearMax}
          step={1}
          fromLabel={t("fields.from")}
          toLabel={t("fields.to")}
          onChange={(min, max) => setFilters({ yearMin: min, yearMax: max, page: 1 })}
        />
      </FilterGroup>

      {/* Mileage */}
      <FilterGroup label={t("fields.mileage")}>
        <RangeInputs
          min={filters.mileageMin}
          max={filters.mileageMax}
          step={1000}
          fromLabel={t("fields.from")}
          toLabel={t("fields.to")}
          onChange={(min, max) => setFilters({ mileageMin: min, mileageMax: max, page: 1 })}
        />
      </FilterGroup>

      {/* Fuel */}
      <FilterGroup label={t("fields.fuel")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FUEL_VALUES.map((f) => (
            <CheckRow
              key={f}
              id={`fuel-${f}`}
              label={t(`fuel.${f}`)}
              checked={filters.fuel.includes(f)}
              onCheck={() => toggleFuel(f)}
            />
          ))}
        </div>
      </FilterGroup>

      {/* Transmission */}
      <FilterGroup label={t("fields.transmission")}>
        <RadioGroup
          value={filters.transmission ?? ""}
          onValueChange={(v) =>
            setFilters({
              transmission: (v || null) as (typeof TRANSMISSION_VALUES)[number] | null,
              page: 1,
            })
          }
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
          {TRANSMISSION_VALUES.map((tr) => (
            <label
              key={tr}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 cursor-pointer text-sm",
                filters.transmission === tr && "border-moroccan-red-500/40 bg-moroccan-red-50/30",
              )}
            >
              <RadioGroupItem value={tr} id={`tr-${tr}`} />
              <span>{transmissionLabel(tr, locale)}</span>
            </label>
          ))}
        </RadioGroup>
      </FilterGroup>

      {onApply && (
        <button
          type="button"
          onClick={onApply}
          className="mt-2 h-11 w-full rounded-xl bg-moroccan-gradient text-white font-semibold hover:brightness-105 transition-all"
        >
          {t("applyFilters")}
        </button>
      )}
    </aside>
  )
}

function FilterGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </legend>
      {children}
    </fieldset>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 ps-8 rounded-lg text-sm"
      />
    </div>
  )
}

function ScrollList({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-h-44 overflow-y-auto rounded-lg border border-border bg-background p-2">
      {children}
    </div>
  )
}

function CheckRow({
  id,
  label,
  checked,
  onCheck,
}: {
  id: string
  label: string
  checked: boolean
  onCheck: () => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-moroccan-sand-50 cursor-pointer text-sm"
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onCheck} />
      <span className="flex-1">{label}</span>
    </label>
  )
}

function RangeInputs({
  min,
  max,
  step,
  fromLabel,
  toLabel,
  onChange,
}: {
  min: number | null
  max: number | null
  step: number
  fromLabel: string
  toLabel: string
  onChange: (min: number | null, max: number | null) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        step={step}
        value={min ?? ""}
        onChange={(e) => {
          const v = e.target.value === "" ? null : Number(e.target.value)
          onChange(v, max)
        }}
        placeholder={fromLabel}
        className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:border-moroccan-red-500/40 focus:ring-2 focus:ring-moroccan-red-500/15"
      />
      <span aria-hidden className="text-muted-foreground text-sm">—</span>
      <input
        type="number"
        inputMode="numeric"
        step={step}
        value={max ?? ""}
        onChange={(e) => {
          const v = e.target.value === "" ? null : Number(e.target.value)
          onChange(min, v)
        }}
        placeholder={toLabel}
        className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:border-moroccan-red-500/40 focus:ring-2 focus:ring-moroccan-red-500/15"
      />
    </div>
  )
}

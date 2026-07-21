"use client"

import { useMemo, useState } from "react"
import { RotateCcw, Search } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Link, useRouter } from "@/i18n/navigation"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import type { Brand, CarModel, City } from "@/lib/queries/home"
import { cn } from "@/lib/utils"

type Props = {
  brands: Brand[]
  models: CarModel[]
  cities: City[]
  /** Pre-formatted active-annonce count shown in the "we found X" line. */
  count?: string
}

type Condition = "all" | "neuf" | "occasion"

export function QuickSearch({ brands, models, cities, count }: Props) {
  const t = useTranslations("home.hero")
  const locale = useLocale()
  const router = useRouter()

  const [condition, setCondition] = useState<Condition>("all")
  const [brand, setBrand] = useState<string>("")
  const [model, setModel] = useState<string>("")
  const [city, setCity] = useState<string>("")
  const [priceMin, setPriceMin] = useState<string>("")
  const [priceMax, setPriceMax] = useState<string>("")

  // brand/model/city states hold slugs (not UUIDs) so URL params are
  // human-readable and compatible with the annonces page FiltersSidebar.
  const selectedBrandId = useMemo(
    () => brands.find((b) => b.slug === brand)?.id ?? null,
    [brands, brand],
  )

  const filteredModels = useMemo(() => {
    if (!selectedBrandId) return []
    return models.filter((m) => m.brand_id === selectedBrandId)
  }, [selectedBrandId, models])

  const brandItems = useMemo<ComboboxOption[]>(
    () =>
      brands.map((b) => ({ value: b.slug, label: b.name, logo: b.logo_url })),
    [brands],
  )
  const modelItems = useMemo<ComboboxOption[]>(
    () => filteredModels.map((m) => ({ value: m.slug, label: m.name })),
    [filteredModels],
  )
  const cityItems = useMemo<ComboboxOption[]>(
    () =>
      cities.map((c) => ({
        value: c.slug,
        label: locale === "ar" ? c.name_ar : c.name_fr,
      })),
    [cities, locale],
  )

  const hasFilters =
    condition !== "all" || brand || model || city || priceMin || priceMax

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (condition !== "all") params.set("condition", condition)
    if (brand) params.set("brand", brand)
    if (model) params.set("model", model)
    if (city) params.set("city", city)
    if (priceMin) params.set("priceMin", priceMin)
    if (priceMax) params.set("priceMax", priceMax)
    router.push(`/annonces?${params.toString()}`)
  }

  function handleReset() {
    setCondition("all")
    setBrand("")
    setModel("")
    setCity("")
    setPriceMin("")
    setPriceMax("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-4 sm:p-5 md:p-6 shadow-xl shadow-black/10 border border-border/50"
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div role="tablist" className="inline-flex rounded-xl bg-moroccan-sand-50 p-1">
          <TabButton active={condition === "all"} onClick={() => setCondition("all")}>
            {t("tabAll")}
          </TabButton>
          <TabButton active={condition === "neuf"} onClick={() => setCondition("neuf")}>
            {t("tabNew")}
          </TabButton>
          <TabButton
            active={condition === "occasion"}
            onClick={() => setCondition("occasion")}
          >
            {t("tabUsed")}
          </TabButton>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t("reset")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Field label={t("brand")}>
          <Combobox
            items={brandItems}
            value={brand}
            onValueChange={(v) => {
              setBrand(v)
              setModel("")
            }}
            placeholder={t("anyBrand")}
            emptyText={t("noResults")}
          />
        </Field>

        <Field label={t("model")}>
          <Combobox
            items={modelItems}
            value={model}
            onValueChange={setModel}
            placeholder={t("anyModel")}
            emptyText={t("noResults")}
            disabled={!brand}
          />
        </Field>

        <Field label={t("city")}>
          <Combobox
            items={cityItems}
            value={city}
            onValueChange={setCity}
            placeholder={t("anyCity")}
            emptyText={t("noResults")}
          />
        </Field>

        <Field label={t("minPrice") + " / " + t("maxPrice")}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1000"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder={t("minPrice")}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:border-moroccan-red-500/40 focus:ring-2 focus:ring-moroccan-red-500/15"
            />
            <span aria-hidden className="text-muted-foreground">—</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1000"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder={t("maxPrice")}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:border-moroccan-red-500/40 focus:ring-2 focus:ring-moroccan-red-500/15"
            />
          </div>
        </Field>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-xl h-12 bg-moroccan-gradient text-white text-base font-semibold shadow-moroccan",
            "hover:brightness-105 transition-all duration-200",
          )}
        >
          <Search className="size-5" aria-hidden="true" />
          {t("searchNow")}
        </button>
        <Link
          href="/annonces"
          className="inline-flex items-center justify-center gap-2 rounded-xl h-12 px-5 border-2 border-moroccan-red-500 text-moroccan-red-500 text-sm font-semibold hover:bg-moroccan-red-50 transition-colors"
        >
          {t("advancedSearch")}
        </Link>
      </div>

      {count && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t.rich("found", {
            count,
            strong: (chunks) => (
              <span className="font-bold text-moroccan-red-500">{chunks}</span>
            ),
          })}
        </p>
      )}
    </form>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={cn(
        "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
        active
          ? "bg-white text-moroccan-red-500 shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

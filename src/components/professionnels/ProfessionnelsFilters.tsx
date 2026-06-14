"use client"

import { Search, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useQueryStates } from "nuqs"

import { professionnelsSearchParams } from "@/components/professionnels/searchParams"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import type { City } from "@/lib/queries/home"
import type { Locale } from "@/i18n/routing"

type Props = {
  cities: City[]
}

const RATING_OPTIONS = [4, 3] as const
const SORT_OPTIONS = ["popular", "rating", "newest"] as const

export function ProfessionnelsFilters({ cities }: Props) {
  const t = useTranslations("professionnels.list")
  const locale = useLocale() as Locale
  const [filters, setFilters] = useQueryStates(professionnelsSearchParams, {
    shallow: false,
  })

  function clear() {
    setFilters({ q: "", city: "", minRating: null, sort: "popular", page: 1 })
  }

  const hasActive =
    filters.q !== "" ||
    filters.city !== "" ||
    filters.minRating != null ||
    filters.sort !== "popular"

  // base-ui's <SelectValue> renders the raw value, so we compute the
  // translated/display label and render it in the trigger ourselves.
  const selectedCity = cities.find((c) => c.slug === filters.city) ?? null
  const cityLabel = selectedCity
    ? locale === "ar"
      ? selectedCity.name_ar
      : selectedCity.name_fr
    : null
  const sortLabel = t(
    `sort${filters.sort === "popular" ? "MostCars" : filters.sort === "rating" ? "BestRating" : "Newest"}` as never,
  )

  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-card flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="relative flex-1 min-w-0">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        />
        <input
          type="search"
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value, page: 1 })}
          placeholder={t("search")}
          className="h-11 w-full rounded-xl bg-moroccan-sand-50 border border-transparent ps-9 pe-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-moroccan-red-500/30"
        />
      </div>

      <Select
        value={filters.city || undefined}
        onValueChange={(v) => setFilters({ city: v ?? "", page: 1 })}
      >
        <SelectTrigger className="h-11 w-full sm:w-[180px] rounded-xl">
          <span
            className={`flex-1 text-start text-sm truncate ${cityLabel ? "text-foreground" : "text-muted-foreground"}`}
          >
            {cityLabel ?? t("filterCity")}
          </span>
        </SelectTrigger>
        <SelectContent>
          {cities.map((c) => (
            <SelectItem key={c.id} value={c.slug}>
              {locale === "ar" ? c.name_ar : c.name_fr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.minRating ? String(filters.minRating) : undefined}
        onValueChange={(v) =>
          setFilters({ minRating: v ? Number(v) : null, page: 1 })
        }
      >
        <SelectTrigger className="h-11 w-full sm:w-[160px] rounded-xl">
          <span
            className={`flex-1 text-start text-sm truncate ${filters.minRating ? "text-foreground" : "text-muted-foreground"}`}
          >
            {filters.minRating
              ? t("minStars", { stars: filters.minRating })
              : t("filterMinRating")}
          </span>
        </SelectTrigger>
        <SelectContent>
          {RATING_OPTIONS.map((r) => (
            <SelectItem key={r} value={String(r)}>
              {t("minStars", { stars: r })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sort}
        onValueChange={(v) => {
          if (v) setFilters({ sort: v as (typeof SORT_OPTIONS)[number], page: 1 })
        }}
      >
        <SelectTrigger className="h-11 w-full sm:w-[180px] rounded-xl">
          <span className="flex-1 text-start text-sm truncate text-foreground">
            {sortLabel}
          </span>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`sort${s === "popular" ? "MostCars" : s === "rating" ? "BestRating" : "Newest"}` as never)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActive && (
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1 h-9 px-3 text-xs text-moroccan-red-500 hover:underline shrink-0"
        >
          <X className="size-3.5" />
          {t("filters")}
        </button>
      )}
    </div>
  )
}

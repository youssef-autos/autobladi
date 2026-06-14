"use client"

import Image from "next/image"
import { Car, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { useCompare } from "@/hooks/use-compare"
import { origineLabel } from "@/lib/vehicle-options"
import { formatMileage, formatPrice } from "@/lib/utils/format"
import type { CompareCar } from "@/app/[locale]/(main)/comparer/actions"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  cars: CompareCar[]
}

const FUEL: Record<string, { ar: string; fr: string }> = {
  essence: { ar: "بنزين", fr: "Essence" },
  diesel: { ar: "ديزل", fr: "Diesel" },
  hybrid: { ar: "هايبرد", fr: "Hybride" },
  electric: { ar: "كهربائي", fr: "Électrique" },
  lpg: { ar: "غاز", fr: "GPL" },
}

export function CompareTable({ cars }: Props) {
  const t = useTranslations("compare")
  const locale = useLocale() as Locale
  const { remove } = useCompare()

  const isAr = locale === "ar"
  const dash = "—"

  // Highlight the cheapest price + lowest mileage across the set.
  const prices = cars.map((c) => c.price).filter((p): p is number => p != null)
  const minPrice = prices.length ? Math.min(...prices) : null
  const mileages = cars.map((c) => c.mileage).filter((m): m is number => m != null)
  const minMileage = mileages.length ? Math.min(...mileages) : null

  const yesNo = (v: boolean | null) =>
    v == null ? dash : v ? t("yes") : t("no")

  const rows: {
    label: string
    render: (c: CompareCar) => React.ReactNode
    highlight?: (c: CompareCar) => boolean
  }[] = [
    {
      label: t("rows.price"),
      render: (c) =>
        c.price != null ? (
          <span className="font-bold text-moroccan-red-600">
            {formatPrice(c.price, locale)}
          </span>
        ) : (
          dash
        ),
      highlight: (c) => c.price != null && c.price === minPrice,
    },
    { label: t("rows.brand"), render: (c) => c.brand?.name ?? dash },
    { label: t("rows.model"), render: (c) => c.model?.name ?? dash },
    { label: t("rows.year"), render: (c) => c.year ?? dash },
    {
      label: t("rows.mileage"),
      render: (c) => (c.mileage != null ? formatMileage(c.mileage, locale) : dash),
      highlight: (c) => c.mileage != null && c.mileage === minMileage,
    },
    {
      label: t("rows.fuel"),
      render: (c) => (c.fuel_type ? (FUEL[c.fuel_type]?.[locale] ?? c.fuel_type) : dash),
    },
    {
      label: t("rows.transmission"),
      render: (c) =>
        c.transmission
          ? c.transmission === "automatique"
            ? isAr
              ? "أوتوماتيك"
              : "Automatique"
            : isAr
              ? "عادي"
              : "Manuelle"
          : dash,
    },
    {
      label: t("rows.condition"),
      render: (c) =>
        c.condition
          ? c.condition === "neuf"
            ? isAr
              ? "جديدة"
              : "Neuf"
            : isAr
              ? "مستعملة"
              : "Occasion"
          : dash,
    },
    { label: t("rows.color"), render: (c) => c.color || dash },
    { label: t("rows.doors"), render: (c) => c.doors ?? dash },
    { label: t("rows.seats"), render: (c) => c.seats ?? dash },
    {
      label: t("rows.power"),
      render: (c) => (c.engine_power != null ? `${c.engine_power} ch` : dash),
    },
    {
      label: t("rows.displacement"),
      render: (c) => (c.engine_size != null ? `${c.engine_size} cc` : dash),
    },
    {
      label: t("rows.origine"),
      render: (c) => (c.origine ? origineLabel(c.origine, locale) : dash),
    },
    {
      label: t("rows.city"),
      render: (c) => (c.city ? (isAr ? c.city.name_ar : c.city.name_fr) : dash),
    },
    { label: t("rows.firstOwner"), render: (c) => yesNo(c.first_owner) },
    { label: t("rows.accidentFree"), render: (c) => yesNo(c.accident_free) },
  ]

  const colWidth = "min-w-[180px] w-[220px]"

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky start-0 z-10 bg-card p-4 text-start align-bottom min-w-[130px] w-[160px]">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("vehicle")}
              </span>
            </th>
            {cars.map((c) => (
              <th
                key={c.id}
                className={cn("border-s border-border p-4 align-top", colWidth)}
              >
                <div className="space-y-2">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-moroccan-sand-50">
                    {c.main_image ? (
                      <Image
                        src={c.main_image}
                        alt={c.title}
                        fill
                        sizes="220px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-moroccan-sand-200">
                        <Car className="size-8" aria-hidden="true" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(c.slug)}
                      aria-label={t("remove")}
                      title={t("remove")}
                      className="absolute top-2 end-2 inline-flex size-7 items-center justify-center rounded-full bg-black/55 text-white hover:bg-moroccan-red-500 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <Link
                    href={`/annonces/${c.slug}`}
                    className="block font-semibold text-foreground leading-tight line-clamp-2 hover:text-moroccan-red-600"
                  >
                    {c.title}
                  </Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={row.label}
              className={cn(ri % 2 === 0 ? "bg-moroccan-sand-50/40" : "bg-card")}
            >
              <th className="sticky start-0 z-10 border-t border-border bg-inherit p-4 text-start text-xs font-medium text-muted-foreground">
                {row.label}
              </th>
              {cars.map((c) => (
                <td
                  key={c.id}
                  className={cn(
                    "border-s border-t border-border p-4 text-foreground",
                    row.highlight?.(c) &&
                      "bg-moroccan-mint-500/10 font-semibold text-moroccan-mint-700",
                  )}
                >
                  {row.render(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

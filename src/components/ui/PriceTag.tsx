"use client"

import { useLocale } from "next-intl"

import { cn } from "@/lib/utils"
import { formatPrice, type Locale } from "@/lib/utils/format"

type Size = "sm" | "md" | "lg" | "xl"

const sizes: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl md:text-3xl",
}

type Props = {
  price: number | null | undefined
  size?: Size
  className?: string
  /** Override locale (otherwise inferred from next-intl context) */
  locale?: Locale
}

export function PriceTag({ price, size = "lg", className, locale }: Props) {
  const inferred = (useLocale() as Locale | undefined) ?? "fr"
  const effectiveLocale = locale ?? inferred

  return (
    <span
      className={cn(
        "font-semibold tabular-nums text-moroccan-red-500",
        sizes[size],
        className,
      )}
    >
      {formatPrice(price, effectiveLocale)}
    </span>
  )
}
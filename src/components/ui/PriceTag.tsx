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
  /** Seller chose to hide the price — show "Prix sur demande" instead. */
  priceOnRequest?: boolean
  size?: Size
  className?: string
  /** Override locale (otherwise inferred from next-intl context) */
  locale?: Locale
}

export function PriceTag({
  price,
  priceOnRequest,
  size = "lg",
  className,
  locale,
}: Props) {
  const inferred = (useLocale() as Locale | undefined) ?? "fr"
  const effectiveLocale = locale ?? inferred

  if (priceOnRequest) {
    return (
      <span className={cn("font-semibold text-foreground/80", sizes[size], className)}>
        {effectiveLocale === "ar" ? "السعر عند الطلب" : "Prix sur demande"}
      </span>
    )
  }

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
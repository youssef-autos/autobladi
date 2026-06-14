import { BadgeCheck } from "lucide-react"

import { cn } from "@/lib/utils"

type Size = "sm" | "md" | "lg"
type Variant = "mint" | "blue"
/** "soft" = tinted (white surfaces); "solid" = filled (legible over images). */
type Tone = "soft" | "solid"

const sizeStyles: Record<Size, string> = {
  sm: "h-5 px-1.5 text-[10px] gap-0.5",
  md: "h-6 px-2 text-xs gap-1",
  lg: "h-7 px-2.5 text-sm gap-1",
}

const iconStyles: Record<Size, string> = {
  sm: "size-2.5",
  md: "size-3.5",
  lg: "size-4",
}

const toneStyles: Record<Variant, Record<Tone, string>> = {
  mint: {
    soft: "bg-moroccan-mint-500/10 text-moroccan-mint-600 border-moroccan-mint-500/30",
    solid: "bg-moroccan-mint-500 text-white border-transparent shadow-sm",
  },
  blue: {
    soft: "bg-blue-50 text-blue-700 border-blue-300",
    solid: "bg-blue-600 text-white border-transparent shadow-sm",
  },
}

type Props = {
  label: string
  tooltip?: string
  size?: Size
  variant?: Variant
  tone?: Tone
  className?: string
  /** Render without text — icon only */
  iconOnly?: boolean
}

/**
 * Reusable "verified" badge with native tooltip via `title`.
 * Use on dealer cards, annonce cards, profile mentions etc.
 */
export function VerifiedBadge({
  label,
  tooltip,
  size = "md",
  variant = "mint",
  tone = "soft",
  className,
  iconOnly = false,
}: Props) {
  return (
    <span
      title={tooltip ?? label}
      aria-label={tooltip ?? label}
      className={cn(
        "inline-flex items-center rounded-full border font-medium tracking-tight",
        sizeStyles[size],
        toneStyles[variant][tone],
        iconOnly && "px-1 aspect-square justify-center",
        className,
      )}
    >
      <BadgeCheck className={iconStyles[size]} strokeWidth={2} aria-hidden="true" />
      {!iconOnly && <span>{label}</span>}
    </span>
  )
}

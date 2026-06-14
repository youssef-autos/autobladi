import { Megaphone } from "lucide-react"

import { cn } from "@/lib/utils"

type Props = {
  /** Localized "Advertising slot" label. */
  label: string
  /** Tailwind height class (e.g. `"h-[180px] md:h-[220px]"`). */
  heightClass?: string
  /** Inline style — used to apply an aspect-ratio/max-width from the placement. */
  style?: React.CSSProperties
  className?: string
}

/**
 * Empty-state placeholder shown when no active ad is matched for a
 * placement slug. Kept visually subtle but still legible so admins can see
 * where future ads will appear during development.
 */
export function AdPlaceholder({
  label,
  heightClass = "h-[150px] md:h-[180px]",
  style,
  className,
}: Props) {
  return (
    <div
      role="complementary"
      aria-label="Advertisement placeholder"
      style={style}
      className={cn(
        "flex items-center justify-center rounded-2xl border-2 border-dashed border-moroccan-gold-500/40 bg-moroccan-gold-50/30 text-muted-foreground",
        heightClass,
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Megaphone className="size-4 text-moroccan-gold-600" aria-hidden="true" />
        {label}
      </div>
    </div>
  )
}

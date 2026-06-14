import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type Props = {
  icon: LucideIcon
  label: string
  value: number | string
  hint?: string
  accent?: "red" | "gold" | "mint" | "default"
  className?: string
}

const accentStyles: Record<NonNullable<Props["accent"]>, string> = {
  red: "bg-moroccan-red-50 text-moroccan-red-500",
  gold: "bg-moroccan-gold-50 text-moroccan-gold-700",
  mint: "bg-moroccan-mint-500/10 text-moroccan-mint-500",
  default: "bg-moroccan-sand-50 text-foreground",
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "default",
  className,
}: Props) {
  return (
    <article
      className={cn(
        "rounded-2xl bg-card border border-border p-5 shadow-soft",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-3xl font-bold text-foreground mt-1 tabular-nums">
            {value}
          </p>
          {hint && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{hint}</p>
          )}
        </div>
        <span
          className={cn(
            "inline-flex items-center justify-center size-10 rounded-xl shrink-0",
            accentStyles[accent],
          )}
        >
          <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

"use client"

import { GitCompare } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useCompare } from "@/hooks/use-compare"
import { cn } from "@/lib/utils"

type Props = {
  slug: string
  /** "card" = small round overlay button; "inline" = labelled pill button. */
  variant?: "card" | "inline"
  className?: string
}

export function CompareButton({ slug, variant = "card", className }: Props) {
  const { has, toggle, max } = useCompare()
  const t = useTranslations("compare")
  const active = has(slug)

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const res = toggle(slug)
    if (res === "full") {
      toast.error(t("maxReached", { max }))
      return
    }
    toast.success(res === "added" ? t("added") : t("removed"))
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          "inline-flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-medium transition-colors",
          active
            ? "border-moroccan-mint-500/50 bg-moroccan-mint-500/10 text-moroccan-mint-600"
            : "border-border bg-background text-foreground hover:bg-moroccan-sand-50",
          className,
        )}
      >
        <GitCompare className="size-4" aria-hidden="true" />
        {active ? t("inCompare") : t("addToCompare")}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? t("inCompare") : t("addToCompare")}
      title={active ? t("inCompare") : t("addToCompare")}
      className={cn(
        "relative z-30 inline-flex size-8 items-center justify-center rounded-full backdrop-blur transition-colors",
        active
          ? "bg-moroccan-mint-500 text-white"
          : "bg-white/90 text-foreground/70 hover:bg-white hover:text-moroccan-mint-600",
        className,
      )}
    >
      <GitCompare className="size-4" />
    </button>
  )
}

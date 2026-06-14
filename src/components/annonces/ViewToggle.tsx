"use client"

import { LayoutGrid, List } from "lucide-react"
import { useTranslations } from "next-intl"
import { useQueryState } from "nuqs"

import { annoncesSearchParams } from "@/components/annonces/searchParams"
import { cn } from "@/lib/utils"

export function ViewToggle() {
  const t = useTranslations("annonces.view")
  const [view, setView] = useQueryState("view", annoncesSearchParams.view)

  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="inline-flex items-center rounded-xl border border-border bg-background p-0.5"
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === "grid"}
        aria-label={t("grid")}
        onClick={() => setView("grid")}
        className={cn(
          "inline-flex items-center justify-center size-9 rounded-lg transition-colors",
          view === "grid"
            ? "bg-moroccan-red-50 text-moroccan-red-500"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "list"}
        aria-label={t("list")}
        onClick={() => setView("list")}
        className={cn(
          "inline-flex items-center justify-center size-9 rounded-lg transition-colors",
          view === "list"
            ? "bg-moroccan-red-50 text-moroccan-red-500"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <List className="size-4" />
      </button>
    </div>
  )
}

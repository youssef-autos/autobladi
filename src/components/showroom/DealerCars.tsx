"use client"

import { useState } from "react"
import { Car } from "lucide-react"
import { useTranslations } from "next-intl"

import { CarCard } from "@/components/cars/CarCard"
import { EmptyState } from "@/components/ui/EmptyState"
import type { AnnonceCardData } from "@/lib/queries/home"
import { cn } from "@/lib/utils"

type Filter = "all" | "neuf" | "occasion"

type Props = {
  cars: AnnonceCardData[]
}

export function DealerCars({ cars }: Props) {
  const t = useTranslations("showrooms")
  const [filter, setFilter] = useState<Filter>("all")

  const counts = {
    all: cars.length,
    neuf: cars.filter((c) => c.condition === "neuf").length,
    occasion: cars.filter((c) => c.condition === "occasion").length,
  }

  const filtered =
    filter === "all" ? cars : cars.filter((c) => c.condition === filter)

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: t("detail.filterAll") },
    { key: "neuf", label: t("detail.filterNew") },
    { key: "occasion", label: t("detail.filterUsed") },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground inline-flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-moroccan-gradient" aria-hidden="true" />
          {t("tabs.cars")}
        </h2>
        <span className="text-sm font-medium text-muted-foreground">
          {t("list.carsCount", { count: filtered.length })}
        </span>
      </div>

      {/* New / Used / All filter */}
      <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-xl bg-moroccan-sand-50/70 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              filter === tab.key
                ? "bg-card text-moroccan-red-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            <span className="text-xs tabular-nums opacity-70">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={Car}
            title={t("list.empty")}
            description={t("list.emptyDesc")}
          />
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <li key={c.id}>
              <CarCard annonce={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

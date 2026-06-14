"use client"

import { useMemo, useState } from "react"
import { Search, Star } from "lucide-react"
import { useTranslations } from "next-intl"

import { ReviewRow } from "@/components/admin/reviews/ReviewRow"
import { EmptyState } from "@/components/ui/EmptyState"
import type { AdminReviewRow } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"

type Props = {
  reviews: AdminReviewRow[]
}

type RatingFilter = "all" | 1 | 2 | 3 | 4 | 5

const RATING_TABS: RatingFilter[] = ["all", 5, 4, 3, 2, 1]

export function ReviewsManager({ reviews }: Props) {
  const t = useTranslations("adminPanel.reviewsPage")
  const [rating, setRating] = useState<RatingFilter>("all")
  const [query, setQuery] = useState("")

  const counts = useMemo(() => {
    const map = new Map<RatingFilter, number>()
    map.set("all", reviews.length)
    for (const r of reviews) {
      map.set(r.rating as RatingFilter, (map.get(r.rating as RatingFilter) ?? 0) + 1)
    }
    return map
  }, [reviews])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reviews.filter((r) => {
      if (rating !== "all" && r.rating !== rating) return false
      if (!q) return true
      return (
        (r.dealer?.name ?? "").toLowerCase().includes(q) ||
        (r.author?.full_name ?? "").toLowerCase().includes(q) ||
        (r.comment ?? "").toLowerCase().includes(q)
      )
    })
  }, [reviews, rating, query])

  return (
    <div className="space-y-5">
      {/* Rating tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {RATING_TABS.map((r) => {
          const count = counts.get(r) ?? 0
          const isActive = rating === r
          return (
            <button
              key={String(r)}
              type="button"
              onClick={() => setRating(r)}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm font-medium transition-colors",
                isActive
                  ? "border-moroccan-red-500/40 bg-moroccan-red-50 text-moroccan-red-600"
                  : "border-border bg-card text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground",
              )}
            >
              {r === "all" ? (
                t("ratingTabs.all")
              ) : (
                <span className="inline-flex items-center gap-1">
                  {r}
                  <Star
                    className={cn(
                      "size-3.5",
                      isActive
                        ? "fill-moroccan-gold-500 text-moroccan-gold-500"
                        : "fill-moroccan-gold-400/60 text-moroccan-gold-400/60",
                    )}
                    strokeWidth={1.5}
                  />
                </span>
              )}
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] tabular-nums",
                  isActive
                    ? "bg-moroccan-red-500 text-white"
                    : "bg-moroccan-sand-100 text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className="w-full h-10 ps-9 pe-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("count", { count: filtered.length })}
      </p>

      {/* Table */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState icon={Star} title={t("empty")} description={t("emptyDesc")} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-8 shadow-card text-center text-sm text-muted-foreground">
          {t("noResults")}
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3 min-w-[180px]">
                    {t("columns.dealer")}
                  </th>
                  <th className="text-start px-4 py-3 min-w-[150px]">
                    {t("columns.author")}
                  </th>
                  <th className="text-start px-4 py-3">{t("columns.rating")}</th>
                  <th className="text-start px-4 py-3">{t("columns.comment")}</th>
                  <th className="text-start px-4 py-3">{t("columns.date")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <ReviewRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

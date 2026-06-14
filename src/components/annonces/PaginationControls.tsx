"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { useQueryState } from "nuqs"

import { annoncesSearchParams } from "@/components/annonces/searchParams"
import { cn } from "@/lib/utils"

type Props = {
  page: number
  totalPages: number
}

export function PaginationControls({ page, totalPages }: Props) {
  const t = useTranslations("annonces")
  const [, setPage] = useQueryState("page", annoncesSearchParams.page)

  if (totalPages <= 1) return null

  const go = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return
    setPage(next)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Compact window: first, prev/curr/next neighbors, last
  const pages = computeWindow(page, totalPages)

  return (
    <nav className="flex items-center justify-center gap-1 py-8" aria-label="Pagination">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-moroccan-sand-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        <span className="hidden sm:inline">{t("previous")}</span>
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="size-9 inline-flex items-center justify-center text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "size-9 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
              p === page
                ? "bg-moroccan-gradient text-white shadow-moroccan"
                : "border border-border bg-background text-foreground hover:bg-moroccan-sand-50",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-moroccan-sand-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="hidden sm:inline">{t("next")}</span>
        <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
      </button>
    </nav>
  )
}

function computeWindow(page: number, total: number): Array<number | "…"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const result: Array<number | "…"> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(total - 1, page + 1)
  if (start > 2) result.push("…")
  for (let i = start; i <= end; i++) result.push(i)
  if (end < total - 1) result.push("…")
  result.push(total)
  return result
}

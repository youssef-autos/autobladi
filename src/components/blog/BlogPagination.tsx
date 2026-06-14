import { getTranslations } from "next-intl/server"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

type Props = {
  /** Current page (1-indexed). */
  page: number
  totalPages: number
  /** Pathname relative to locale, e.g. "/blog" or "/blog/category/news". */
  basePath: string
  /** Extra query params to preserve on each link (e.g. `q`). */
  preserveParams?: Record<string, string | null | undefined>
}

export async function BlogPagination({
  page,
  totalPages,
  basePath,
  preserveParams,
}: Props) {
  const t = await getTranslations("blog.pagination")
  if (totalPages <= 1) return null

  const hrefFor = (p: number): string => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(preserveParams ?? {})) {
      if (v) sp.set(k, v)
    }
    if (p > 1) sp.set("page", String(p))
    const qs = sp.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 pt-4"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="inline-flex items-center gap-1 h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium hover:bg-moroccan-sand-50"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("previous")}
        </Link>
      ) : (
        <span className={dimmedBtnCls}>
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("previous")}
        </span>
      )}

      <span className="text-sm text-muted-foreground">
        {t("page", { page, total: totalPages })}
      </span>

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className="inline-flex items-center gap-1 h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium hover:bg-moroccan-sand-50"
        >
          {t("next")}
          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      ) : (
        <span className={dimmedBtnCls}>
          {t("next")}
          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </span>
      )}
    </nav>
  )
}

const dimmedBtnCls = cn(
  "inline-flex items-center gap-1 h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium opacity-50 cursor-not-allowed",
)

"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

type Props = {
  className?: string
}

/**
 * Search input that pushes `?q=...` to the current pathname. Stays on the
 * same route (so the category filter is preserved if we're on a category
 * page) and resets to page 1 by stripping any `page` param.
 */
export function BlogSearch({ className }: Props) {
  const t = useTranslations("blog.filters")
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const [pending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const q = (formData.get("q") as string | null)?.trim() ?? ""
    const next = new URLSearchParams(searchParams.toString())
    if (q) next.set("q", q)
    else next.delete("q")
    next.delete("page")
    startTransition(() => {
      const path = window.location.pathname || `/${locale}/blog`
      router.push(`${path}?${next.toString()}`)
    })
  }

  return (
    <form onSubmit={onSubmit} className={cn("relative", className)}>
      <Search
        className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        name="q"
        defaultValue={searchParams.get("q") ?? ""}
        placeholder={t("searchPlaceholder")}
        aria-label={t("search")}
        className="w-full h-11 ps-10 pe-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"
        disabled={pending}
      />
    </form>
  )
}

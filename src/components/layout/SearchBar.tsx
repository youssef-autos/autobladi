"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  /** Visual size — "sm" for header, "md" for hero/mobile */
  size?: "sm" | "md"
  onSubmit?: () => void
}

export function SearchBar({ className, size = "sm", onSubmit }: Props) {
  const t = useTranslations("nav")
  const router = useRouter()
  const [q, setQ] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const query = q.trim()
    if (!query) return
    router.push(`/annonces?q=${encodeURIComponent(query)}`)
    onSubmit?.()
  }

  const heightCls = size === "sm" ? "h-9 text-sm" : "h-11 text-base"

  return (
    <form onSubmit={submit} role="search" className={cn("w-full", className)}>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          className={cn(
            "w-full rounded-full bg-moroccan-sand-50 border border-transparent ps-9 pe-4",
            "placeholder:text-muted-foreground/70 text-foreground",
            "focus:outline-none focus:border-moroccan-red-500/30 focus:ring-2 focus:ring-moroccan-red-500/15",
            "transition-colors",
            heightCls,
          )}
        />
      </div>
    </form>
  )
}

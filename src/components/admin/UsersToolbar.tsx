"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

type AccountType = "all" | "gratuit" | "pro"

const TYPES: AccountType[] = ["all", "gratuit", "pro"]

export function UsersToolbar() {
  const t = useTranslations("adminPanel.usersPage")
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const [pending, startTransition] = useTransition()

  const rawType = searchParams.get("type")
  const currentType: AccountType = TYPES.includes(rawType as AccountType)
    ? (rawType as AccountType)
    : "all"

  function push(next: URLSearchParams) {
    startTransition(() => {
      const path = window.location.pathname || `/${locale}/admin/users`
      const qs = next.toString()
      router.push(qs ? `${path}?${qs}` : path)
    })
  }

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const q = (formData.get("q") as string | null)?.trim() ?? ""
    const next = new URLSearchParams(searchParams.toString())
    if (q) next.set("q", q)
    else next.delete("q")
    push(next)
  }

  function onFilter(type: AccountType) {
    if (type === currentType) return
    const next = new URLSearchParams(searchParams.toString())
    if (type === "all") next.delete("type")
    else next.set("type", type)
    push(next)
  }

  const labels: Record<AccountType, string> = {
    all: t("filterAll"),
    gratuit: t("filterGratuit"),
    pro: t("filterPro"),
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <form onSubmit={onSearch} className="relative flex-1 sm:max-w-md">
        <Search
          className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder={t("search")}
          aria-label={t("search")}
          disabled={pending}
          className="w-full h-11 ps-10 pe-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"
        />
      </form>

      <div className="flex items-center gap-1.5 flex-wrap">
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onFilter(type)}
            disabled={pending}
            aria-pressed={currentType === type}
            className={`h-9 px-3.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
              currentType === type
                ? "bg-moroccan-red-500 text-white"
                : "border border-border text-foreground hover:bg-moroccan-sand-50"
            }`}
          >
            {labels[type]}
          </button>
        ))}
      </div>
    </div>
  )
}

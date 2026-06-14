"use client"

import { useTransition } from "react"
import { RotateCw } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { clearCache } from "@/app/[locale]/admin/cache-actions"

export function CacheClearButton() {
  const t = useTranslations("adminPanel")
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          const res = await clearCache()
          if (!res.ok) {
            toast.error(t("cacheError"))
            return
          }
          toast.success(t("cacheCleared"))
        })
      }
      disabled={pending}
      className="inline-flex items-center gap-2 w-full rounded-lg px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white disabled:opacity-60"
    >
      <RotateCw className={pending ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden="true" />
      {pending ? t("cacheClearing") : t("cacheClear")}
    </button>
  )
}

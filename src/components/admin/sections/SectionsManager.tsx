"use client"

import { useState, useTransition } from "react"
import { ArrowDown, ArrowUp, Eye, EyeOff, Save } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { saveHomeSections } from "@/app/[locale]/admin/sections/actions"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import type { HomeSectionConfig } from "@/lib/home-sections"
import { cn } from "@/lib/utils"

type Props = {
  initial: HomeSectionConfig[]
}

export function SectionsManager({ initial }: Props) {
  const t = useTranslations("adminPanel.sectionsPage")
  const [items, setItems] = useState<HomeSectionConfig[]>(initial)
  const [pending, startTransition] = useTransition()

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    setItems((prev) => {
      const next = [...prev]
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return next
    })
  }

  function toggle(index: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, visible: !it.visible } : it)),
    )
  }

  function onSave() {
    startTransition(async () => {
      const res = await saveHomeSections(items)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.saved"))
    })
  }

  const visibleCount = items.filter((i) => i.visible).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {t("count", { visible: visibleCount, total: items.length })}
        </p>
        <MoroccanButton onClick={onSave} size="sm" loading={pending}>
          <Save className="size-4 me-2" />
          {pending ? t("saving") : t("save")}
        </MoroccanButton>
      </div>

      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li
            key={item.key}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-card p-3 pe-4 shadow-card transition-colors",
              item.visible
                ? "border-border"
                : "border-dashed border-border/70 opacity-70",
            )}
          >
            {/* Order badge */}
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-moroccan-sand-50 text-xs font-semibold text-muted-foreground tabular-nums">
              {i + 1}
            </span>

            {/* Reorder */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={t("moveUp")}
                className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label={t("moveDown")}
                className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ArrowDown className="size-3.5" />
              </button>
            </div>

            {/* Label */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {t(`labels.${item.key}`)}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.visible ? t("visible") : t("hidden")}
              </p>
            </div>

            {/* Visibility toggle */}
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={item.visible}
              aria-label={item.visible ? t("hide") : t("show")}
              title={item.visible ? t("hide") : t("show")}
              className={cn(
                "inline-flex items-center justify-center size-9 rounded-lg transition-colors",
                item.visible
                  ? "bg-moroccan-mint-500/10 text-moroccan-mint-600 hover:bg-moroccan-mint-500/20"
                  : "bg-moroccan-sand-100 text-muted-foreground hover:bg-moroccan-sand-200",
              )}
            >
              {item.visible ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

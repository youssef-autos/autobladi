"use client"

import { ShieldAlert } from "lucide-react"
import { useTranslations } from "next-intl"

export function SafetyTips() {
  const t = useTranslations("annonceDetail.safety")

  return (
    <aside className="rounded-2xl border border-moroccan-gold-500/40 bg-moroccan-gold-50/40 p-5">
      <h3 className="flex items-center gap-2 font-semibold text-foreground mb-3">
        <ShieldAlert className="size-5 text-moroccan-gold-700" aria-hidden="true" />
        {t("title")}
      </h3>
      <ul className="space-y-2 text-sm text-foreground/85 leading-relaxed">
        <li className="flex gap-2">
          <span className="text-moroccan-gold-700">•</span>
          {t("tip1")}
        </li>
        <li className="flex gap-2">
          <span className="text-moroccan-gold-700">•</span>
          {t("tip2")}
        </li>
        <li className="flex gap-2">
          <span className="text-moroccan-gold-700">•</span>
          {t("tip3")}
        </li>
        <li className="flex gap-2">
          <span className="text-moroccan-gold-700">•</span>
          {t("tip4")}
        </li>
      </ul>
    </aside>
  )
}
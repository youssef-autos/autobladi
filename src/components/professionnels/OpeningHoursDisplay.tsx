"use client"

import { Clock } from "lucide-react"
import { useTranslations } from "next-intl"

import { DAY_KEYS, type OpeningHoursMap } from "@/lib/validations/professionnel"
import { cn } from "@/lib/utils"

type Props = {
  hours: OpeningHoursMap | null
  className?: string
}

export function OpeningHoursDisplay({ hours, className }: Props) {
  const t = useTranslations("professionnels.about")

  if (!hours) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {t("noHours")}
      </p>
    )
  }

  return (
    <ul className={cn("divide-y divide-border", className)}>
      {DAY_KEYS.map((day) => {
        const dh = hours[day]
        const isOpen = dh?.open && dh.from && dh.to
        return (
          <li key={day} className="flex items-center justify-between py-2 text-sm">
            <span className="font-medium text-foreground">{t(`days.${day}`)}</span>
            {isOpen ? (
              <span className="text-muted-foreground tabular-nums inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-moroccan-gold-500" aria-hidden="true" />
                {dh.from} — {dh.to}
              </span>
            ) : (
              <span className="text-destructive/80">{t("closed")}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
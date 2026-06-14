"use client"

import { useTranslations } from "next-intl"

import { Switch } from "@/components/ui/switch"
import {
  DAY_KEYS,
  type DayKey,
  type OpeningHoursMap,
} from "@/lib/validations/professionnel"
import { cn } from "@/lib/utils"

type Props = {
  value: OpeningHoursMap
  onChange: (next: OpeningHoursMap) => void
}

export function OpeningHoursEditor({ value, onChange }: Props) {
  const t = useTranslations("showroom.hours")
  const tDays = useTranslations("professionnels.about.days")

  function patch(day: DayKey, change: Partial<OpeningHoursMap[DayKey]>) {
    onChange({ ...value, [day]: { ...value[day], ...change } })
  }

  return (
    <ul className="divide-y divide-border">
      {DAY_KEYS.map((day) => {
        const d = value[day] ?? { open: false }
        return (
          <li
            key={day}
            className={cn(
              "py-3 grid grid-cols-1 sm:grid-cols-[120px_auto_1fr_auto_1fr] gap-3 sm:items-center",
            )}
          >
            <span className="font-medium text-sm text-foreground">
              {tDays(day)}
            </span>

            <label className="inline-flex items-center gap-2 text-xs">
              <Switch
                checked={d.open}
                onCheckedChange={(v) =>
                  patch(day, {
                    open: v === true,
                    from: v === true ? d.from ?? "09:00" : undefined,
                    to: v === true ? d.to ?? "19:00" : undefined,
                  })
                }
              />
              <span className="text-muted-foreground">
                {d.open ? t("open") : t("closed")}
              </span>
            </label>

            {d.open ? (
              <>
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  {t("from")}
                  <input
                    type="time"
                    value={d.from ?? "09:00"}
                    onChange={(e) => patch(day, { from: e.target.value })}
                    className="h-9 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:border-moroccan-red-500/40"
                  />
                </label>
                <span className="hidden sm:block" />
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  {t("to")}
                  <input
                    type="time"
                    value={d.to ?? "19:00"}
                    onChange={(e) => patch(day, { to: e.target.value })}
                    className="h-9 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:border-moroccan-red-500/40"
                  />
                </label>
              </>
            ) : (
              <span className="col-span-3 text-xs text-muted-foreground sm:text-end">
                {t("closed")}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

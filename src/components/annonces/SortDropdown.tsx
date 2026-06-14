"use client"

import { useTranslations } from "next-intl"
import { useQueryState } from "nuqs"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  SORT_VALUES,
  annoncesSearchParams,
} from "@/components/annonces/searchParams"

export function SortDropdown() {
  const t = useTranslations("annonces.sort")
  const [sort, setSort] = useQueryState("sort", annoncesSearchParams.sort)

  // @base-ui/react SelectPrimitive.Value doesn't auto-read ItemText from
  // the portal — compute the translated label directly to avoid showing
  // the raw key ("priceAsc", "newest"...) in the trigger.
  const label = t(sort as Parameters<typeof t>[0])

  return (
    <Select
      value={sort}
      onValueChange={(v) => {
        if (v) setSort(v as (typeof SORT_VALUES)[number])
      }}
    >
      <SelectTrigger className="h-10 w-[200px] rounded-xl">
        <span className="flex-1 text-start text-sm truncate text-foreground">
          {label}
        </span>
      </SelectTrigger>
      <SelectContent>
        {SORT_VALUES.map((value) => (
          <SelectItem key={value} value={value}>
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

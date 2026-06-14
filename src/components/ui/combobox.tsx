"use client"

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronDown, Search } from "lucide-react"
import { useLocale } from "next-intl"

import { cn } from "@/lib/utils"

export type ComboboxOption = {
  value: string
  label: string
  /** Optional logo/icon URL shown before the label (e.g. brand logos). */
  logo?: string | null
}

type Props = {
  items: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

/**
 * Searchable single-select built on base-ui's Combobox, styled like a native
 * select: the trigger shows the chosen value, and a search box appears at the
 * top of the dropdown to filter the list (contains, case-insensitive). Binds to
 * a plain string id via { value, label, logo } options.
 */
export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = "—",
  searchPlaceholder,
  emptyText = "—",
  disabled,
  className,
}: Props) {
  const locale = useLocale()
  const selected = items.find((i) => i.value === value) ?? null
  const search =
    searchPlaceholder ?? (locale === "ar" ? "بحث..." : "Rechercher...")

  return (
    <ComboboxPrimitive.Root
      items={items}
      value={selected}
      onValueChange={(item) => onValueChange(item ? item.value : "")}
      disabled={disabled}
    >
      <ComboboxPrimitive.Trigger
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors hover:border-moroccan-gold-500/40 focus-visible:border-moroccan-gold-500/60 focus-visible:ring-2 focus-visible:ring-moroccan-gold-500/40 disabled:cursor-not-allowed disabled:opacity-60 data-[popup-open]:border-moroccan-gold-500/60",
          className,
        )}
      >
        {selected?.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.logo}
            alt=""
            className="size-5 shrink-0 object-contain"
          />
        )}
        <ComboboxPrimitive.Value placeholder={placeholder}>
          {(item: ComboboxOption | null) => (
            <span
              className={cn(
                "flex-1 truncate text-start",
                !item && "text-muted-foreground",
              )}
            >
              {item ? item.label : placeholder}
            </span>
          )}
        </ComboboxPrimitive.Value>
        <ComboboxPrimitive.Icon
          render={
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform"
              aria-hidden="true"
            />
          }
        />
      </ComboboxPrimitive.Trigger>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          className="isolate z-50"
        >
          <ComboboxPrimitive.Popup className="w-(--anchor-width) min-w-48 overflow-hidden rounded-xl bg-popover text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10">
            <div className="relative border-b border-border/70 p-2">
              <Search
                className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <ComboboxPrimitive.Input
                placeholder={search}
                className="h-9 w-full rounded-lg border border-border bg-background ps-9 pe-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-moroccan-gold-500/60"
              />
            </div>
            <ComboboxPrimitive.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List className="max-h-60 overflow-y-auto p-1">
              {(item: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 outline-none select-none data-[highlighted]:bg-moroccan-sand-50 data-[selected]:font-medium data-[selected]:text-moroccan-red-600"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {item.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.logo}
                        alt=""
                        loading="lazy"
                        className="size-5 shrink-0 object-contain"
                      />
                    )}
                    <span className="truncate">{item.label}</span>
                  </span>
                  <ComboboxPrimitive.ItemIndicator>
                    <Check
                      className="size-4 text-moroccan-red-500"
                      aria-hidden="true"
                    />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { FiltersSidebar } from "@/components/annonces/FiltersSidebar"
import { SortDropdown } from "@/components/annonces/SortDropdown"
import { Container } from "@/components/ui/Container"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Brand, CarModel, City, Secteur } from "@/lib/queries/home"

type Props = {
  brands: Brand[]
  models: CarModel[]
  cities: City[]
  secteurs: Secteur[]
}

export function MobileFilters(props: Props) {
  const t = useTranslations("annonces")
  const locale = useLocale() as "ar" | "fr"
  const [open, setOpen] = useState(false)
  const side = locale === "ar" ? "right" : "left"

  return (
    <>
      {/* Bottom bar visible on mobile only */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border">
        <Container className="py-3 grid grid-cols-2 gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label={t("openFilters")}
              className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-moroccan-sand-50"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {t("filters")}
            </SheetTrigger>
            <SheetContent
              side={side}
              className="w-[90vw] max-w-md p-0 flex flex-col"
            >
              <SheetHeader className="px-5 py-4 border-b border-border">
                <SheetTitle>{t("filters")}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-5">
                <FiltersSidebar {...props} onApply={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="inline-flex items-center justify-center">
            <SortDropdown />
          </div>
        </Container>
      </div>
    </>
  )
}

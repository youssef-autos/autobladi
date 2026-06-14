"use client"

import { Check } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { presentEquipmentGroups } from "@/lib/equipments"
import { origineLabel } from "@/lib/vehicle-options"
import { formatMileage } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import type { AnnonceDetail } from "@/lib/queries/annonce-detail"
import type { Locale } from "@/i18n/routing"

type Props = {
  annonce: AnnonceDetail
}

const fuelLabels: Record<string, { ar: string; fr: string }> = {
  essence: { ar: "بنزين", fr: "Essence" },
  diesel: { ar: "ديزل", fr: "Diesel" },
  hybrid: { ar: "هايبرد", fr: "Hybride" },
  electric: { ar: "كهربائي", fr: "Électrique" },
  lpg: { ar: "غاز", fr: "GPL" },
}

// The difference between categories comes only from the heading color + icon.
const GROUP_ACCENT: Record<string, string> = {
  confort: "text-moroccan-mint-500",
  exterieur: "text-moroccan-gold-700",
  interieur: "text-moroccan-clay-600",
  securite: "text-moroccan-red-500",
}

const GROUP_ACCENT_FALLBACK = "text-foreground"

export function AnnonceSpecs({ annonce }: Props) {
  const locale = useLocale() as Locale
  const t = useTranslations("annonceDetail")
  const tKey = useTranslations("annonceDetail.keySpecs")
  const tSpecs = useTranslations("annonceDetail.specs")
  const tHist = useTranslations("annonceDetail.history")
  const tInfo = useTranslations("annonceDetail.details")

  const fuelLabel = annonce.fuel_type
    ? (fuelLabels[annonce.fuel_type]?.[locale] ?? annonce.fuel_type)
    : null

  const transmissionLabel =
    annonce.transmission === "automatique"
      ? locale === "ar"
        ? "أوتوماتيك"
        : "Automatique"
      : annonce.transmission === "manuelle"
        ? locale === "ar"
          ? "عادي"
          : "Manuelle"
        : null

  // Every candidate row; empty values are dropped before rendering.
  const rows: Array<{ label: string; value: string | number | null }> = [
    { label: tInfo("brand"), value: annonce.brand?.name ?? null },
    { label: tInfo("model"), value: annonce.model?.name ?? null },
    { label: tKey("year"), value: annonce.year },
    {
      label: tKey("mileage"),
      value: annonce.mileage != null ? formatMileage(annonce.mileage, locale) : null,
    },
    { label: tKey("fuel"), value: fuelLabel },
    { label: tKey("transmission"), value: transmissionLabel },
    { label: tSpecs("displacement"), value: annonce.engine_size },
    {
      label: tSpecs("power"),
      value: annonce.engine_power != null ? `${annonce.engine_power} ch` : null,
    },
    { label: tKey("doors"), value: annonce.doors },
    { label: tSpecs("seats"), value: annonce.seats },
    { label: tKey("color"), value: annonce.color },
    { label: tSpecs("origine"), value: origineLabel(annonce.origine, locale) },
    {
      label: tHist("firstOwner"),
      value:
        annonce.first_owner != null
          ? annonce.first_owner
            ? tHist("yes")
            : tHist("no")
          : null,
    },
    {
      label: tHist("accidentFree"),
      value:
        annonce.accident_free != null
          ? annonce.accident_free
            ? tHist("yes")
            : tHist("no")
          : null,
    },
  ]

  const visibleRows = rows.filter(
    (r) => r.value != null && r.value !== "" && r.value !== undefined,
  )

  const groups = presentEquipmentGroups(annonce.options)

  return (
    <section className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      {/* 1 — Informations véhicule */}
      <div className="p-5 md:p-7">
        <SectionTitle>{tInfo("vehicleInfo")}</SectionTitle>
        {/* A real table: one bordered frame with shared grid lines. 4 columns
            on desktop (label | value | label | value), 1 pair per row on
            mobile. Gray label cells, white value cells. */}
        <dl className="mt-5 grid grid-cols-1 overflow-hidden rounded-xl border border-border sm:grid-cols-2">
          {visibleRows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[40%_1fr] border-b border-border/60"
            >
              <dt className="flex items-center border-e border-border/60 bg-gray-100 px-4 py-2.5 text-sm font-medium text-foreground/80">
                {row.label}
              </dt>
              <dd className="flex items-center border-e border-border/60 px-4 py-2.5 text-sm font-semibold text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 2 — Description */}
      {annonce.description && (
        <div className="border-t border-border bg-gray-50 p-5 md:p-7">
          <SectionTitle>{t("tabs.description")}</SectionTitle>
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-sm text-foreground/90">
            {annonce.description}
          </p>
        </div>
      )}

      {/* 3 — Équipements et options */}
      {groups.length > 0 && (
        <div className="border-t border-border bg-gray-100 p-5 md:p-7">
          <SectionTitle>{tInfo("equipments")}</SectionTitle>
          {/* Each category is a collapsible accordion item. First one open. */}
          <Accordion
            defaultValue={[groups[0]!.group.key]}
            className="mt-5 flex flex-col gap-3"
          >
            {groups.map(({ group, items }) => {
              const accent = GROUP_ACCENT[group.key] ?? GROUP_ACCENT_FALLBACK
              const GroupIcon = group.icon
              return (
                <AccordionItem key={group.key} value={group.key}>
                  <AccordionTrigger>
                    <span className="inline-flex items-center gap-2.5">
                      <GroupIcon
                        className={cn("size-5 shrink-0", accent)}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span className={cn("font-bold", accent)}>
                        {locale === "ar" ? group.ar : group.fr}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        ({items.length})
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionPanel>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0.5">
                      {items.map((item) => (
                        <li
                          key={item.key}
                          className="flex items-center gap-2.5 py-1 text-sm text-foreground/90"
                        >
                          <Check
                            className="size-4 shrink-0 text-moroccan-mint-500"
                            aria-hidden="true"
                          />
                          {locale === "ar" ? item.ar : item.fr}
                        </li>
                      ))}
                    </ul>
                  </AccordionPanel>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      )}
    </section>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 border-b-2 border-moroccan-red-500/25 pb-3 font-display text-xl md:text-2xl font-bold text-moroccan-red-600">
      <span
        className="h-6 w-1.5 rounded-full bg-moroccan-red-500"
        aria-hidden="true"
      />
      {children}
    </h2>
  )
}

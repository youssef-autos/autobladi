"use client"

import { Loader2, RotateCcw, Send, Sparkles, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"
import type { PriceEstimate } from "@/lib/ai/types"
import { formatPrice } from "@/lib/utils/format"
import type { Locale } from "@/i18n/routing"
import type { EstimationFormValues } from "@/lib/validations/estimation"
import { cn } from "@/lib/utils"

type Props = {
  result: PriceEstimate | null
  loading: boolean
  values: EstimationFormValues | null
  locale: Locale
  onReset: () => void
}

const WIZARD_DRAFT_KEY = "autobladi:ajouter:draft:v1"

export function EstimationResult({ result, loading, values, locale, onReset }: Props) {
  const t = useTranslations("estimation")
  const router = useRouter()

  if (loading) {
    return (
      <Pane>
        <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
          <Loader2 className="size-12 text-moroccan-red-500 animate-spin" aria-hidden="true" />
          <h3 className="font-display text-xl font-bold">{t("loading.title")}</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {t("loading.subtitle")}
          </p>
        </div>
      </Pane>
    )
  }

  if (!result || !values) {
    return (
      <Pane>
        <div className="flex flex-col items-center justify-center text-center py-12 space-y-3 text-muted-foreground">
          <span className="inline-flex items-center justify-center size-14 rounded-2xl bg-moroccan-gold-50 text-moroccan-gold-700">
            <Sparkles className="size-6" aria-hidden="true" />
          </span>
          <h3 className="font-semibold text-foreground">{t("placeholder.title")}</h3>
          <p className="text-sm max-w-xs">{t("placeholder.subtitle")}</p>
        </div>
      </Pane>
    )
  }

  const average = Math.round((result.priceMin + result.priceMax) / 2)

  function publishCar() {
    if (!values) return
    try {
      const draft = {
        brandId: values.brandId,
        modelId: values.modelId,
        year: values.year,
        mileage: values.mileage,
        fuelType: values.fuelType,
        condition: values.conditionGrade === "neuf" ? "neuf" : "occasion",
        price: average,
      }
      window.localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // ignore — wizard will fall back to its defaults
    }
    router.push("/dashboard/ajouter")
  }

  return (
    <Pane>
      <div className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-4 motion-safe:duration-500 space-y-6">
        <header className="space-y-1">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-moroccan-gold-700">
            <TrendingUp className="size-4" aria-hidden="true" />
            {t("result.poweredBy")}
          </p>
          <h3 className="font-display text-xl md:text-2xl font-bold">
            {t("result.title")}
          </h3>
        </header>

        {/* Range */}
        <div className="rounded-2xl bg-gradient-to-br from-moroccan-gold-50 to-moroccan-sand-50 p-6 text-center space-y-2 border border-moroccan-gold-500/30">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("result.rangeLabel")}
          </p>
          <p className="font-display text-2xl md:text-3xl font-bold text-foreground tabular-nums">
            {formatPrice(result.priceMin, locale)}
            <span className="text-moroccan-gold-700 mx-2">—</span>
            {formatPrice(result.priceMax, locale)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("result.averageLabel")}:{" "}
            <span className="font-semibold text-moroccan-red-500 tabular-nums">
              {formatPrice(average, locale)}
            </span>
          </p>
        </div>

        {/* Reasoning */}
        <Block label={t("result.reasoningLabel")}>{result.reasoning}</Block>

        {/* Market context */}
        <Block label={t("result.marketLabel")} muted>
          {result.marketContext}
        </Block>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={publishCar}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all"
          >
            <Send className="size-4" aria-hidden="true" />
            {t("result.publishCta")}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-moroccan-sand-50 transition-colors"
          >
            <RotateCcw className="size-4 rtl:scale-x-[-1]" aria-hidden="true" />
            {t("result.againCta")}
          </button>
        </div>
      </div>
    </Pane>
  )
}

function Pane({ children }: { children: React.ReactNode }) {
  return (
    <aside className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-moroccan/30 min-h-[400px] flex flex-col">
      {children}
    </aside>
  )
}

function Block({
  label,
  muted,
  children,
}: {
  label: string
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        {label}
      </p>
      <p
        className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {children}
      </p>
    </section>
  )
}

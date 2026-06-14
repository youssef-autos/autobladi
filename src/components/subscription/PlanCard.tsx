"use client"

import { Check } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { formatPrice } from "@/lib/utils/format"
import { planDiscountPercent } from "@/lib/plan-pricing"
import type { Plan } from "@/lib/queries/subscriptions"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  plan: Plan
  featured?: boolean
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string")
}

export function PlanCard({ plan, featured = false }: Props) {
  const t = useTranslations("subscription.upgrade")
  const locale = useLocale() as Locale
  const name = locale === "ar" && plan.name_ar ? plan.name_ar : plan.name
  const featuresFr = isStringArray(plan.features) ? plan.features : []
  const featuresAr = isStringArray(plan.features_ar) ? plan.features_ar : []
  const features = locale === "ar" && featuresAr.length ? featuresAr : featuresFr
  const tagline =
    (locale === "ar" ? plan.tagline_ar : plan.tagline) || t("tagline")
  const isFree = plan.price === 0
  const discount = planDiscountPercent(plan.original_price, plan.price)

  return (
    <article
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-3xl bg-card transition-all duration-300",
        featured
          ? "border-2 border-moroccan-red-500 shadow-soft ring-1 ring-moroccan-red-500/10 lg:-my-3"
          : "border border-border shadow-card hover:-translate-y-1 hover:border-moroccan-red-500/30 hover:shadow-soft",
      )}
    >
      {/* "Most popular" ribbon — only on the highlighted plan */}
      {featured && (
        <div className="flex h-9 items-center justify-center bg-moroccan-gradient text-[11px] font-bold uppercase tracking-widest text-white">
          {t("popular")}
        </div>
      )}

      <div className="flex flex-1 flex-col p-7">
        {/* Name + discount pill */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-bold text-foreground">{name}</h3>
          {!isFree && discount > 0 && (
            <span className="shrink-0 rounded-full bg-moroccan-mint-500/12 px-2.5 py-1 text-[11px] font-bold text-moroccan-mint-700">
              {t("discountBadge", { percent: discount })}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>

        {/* Price */}
        <div className="mt-5 min-h-[72px]">
          {isFree ? (
            <p className="font-display text-4xl font-bold tabular-nums text-foreground">
              {t("free")}
            </p>
          ) : (
            <>
              {discount > 0 && (
                <span className="block text-sm text-muted-foreground line-through tabular-nums">
                  {formatPrice(plan.original_price, locale)}
                </span>
              )}
              <p className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold tabular-nums text-foreground">
                  {formatPrice(plan.price, locale)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("perDays", { days: plan.duration_days })}
                </span>
              </p>
              {discount > 0 && (
                <span className="mt-1 inline-block text-xs font-semibold text-moroccan-mint-600">
                  {t("save", { percent: discount })}
                </span>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        {isFree ? (
          <span className="mt-6 flex h-11 items-center justify-center rounded-xl bg-moroccan-sand-50 text-sm font-semibold text-muted-foreground">
            {t("currentPlan")}
          </span>
        ) : (
          <Link
            href={`/dashboard/upgrade/payment/${plan.id}`}
            className={cn(
              "mt-6 flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-all",
              featured
                ? "bg-moroccan-gradient text-white shadow-moroccan hover:brightness-105"
                : "border border-moroccan-red-500 text-moroccan-red-600 hover:bg-moroccan-red-50",
            )}
          >
            {t("selectPlan")}
          </Link>
        )}

        {/* Features */}
        <div className="mt-6 border-t border-border/70 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("includes")}
          </p>
          <ul className="space-y-2.5 text-sm">
            <Feature highlight>{t("maxAnnonces", { count: plan.max_annonces })}</Feature>
            {features.map((feat) => (
              <Feature key={feat}>{feat}</Feature>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

function Feature({
  children,
  highlight = false,
}: {
  children: React.ReactNode
  highlight?: boolean
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-moroccan-mint-500/15">
        <Check
          className="size-3.5 text-moroccan-mint-600"
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>
      <span className={cn(highlight ? "font-semibold text-foreground" : "text-foreground/90")}>
        {children}
      </span>
    </li>
  )
}

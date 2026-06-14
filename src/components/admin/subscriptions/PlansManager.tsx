"use client"

import { useState, useTransition } from "react"
import {
  Check,
  CircleDollarSign,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  deletePlan,
  togglePlanActive,
} from "@/app/[locale]/admin/subscriptions/plans/actions"
import { PlanFormDialog } from "@/components/admin/subscriptions/PlanFormDialog"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/EmptyState"
import type { AdminPlanRow } from "@/lib/queries/admin"
import { planDiscountPercent } from "@/lib/plan-pricing"
import { cn } from "@/lib/utils"

type Props = {
  plans: AdminPlanRow[]
}

function toFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string")
  }
  return []
}

export function PlansManager({ plans }: Props) {
  const t = useTranslations("adminPanel.plansPage")
  const locale = useLocale()
  const format = useFormatter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPlanRow | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function onToggle(plan: AdminPlanRow) {
    setPendingId(plan.id)
    startTransition(async () => {
      const res = await togglePlanActive({
        id: plan.id,
        is_active: !plan.is_active,
      })
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(plan.is_active ? t("toast.deactivated") : t("toast.activated"))
    })
  }

  function onDelete(plan: AdminPlanRow) {
    if (!window.confirm(t("deleteConfirm", { name: plan.name }))) return
    setPendingId(plan.id)
    startTransition(async () => {
      const res = await deletePlan(plan.id)
      setPendingId(null)
      if (!res.ok) {
        toast.error(res.error === "plan_in_use" ? t("toast.inUse") : t("toast.error"))
        return
      }
      toast.success(t("toast.deleted"))
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {t("count", { count: plans.length })}
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setCreateOpen(true)
          }}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("addPlan")}
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={CircleDollarSign}
            title={t("empty")}
            description={t("emptyDesc")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const planName =
              locale === "ar" ? plan.name_ar || plan.name : plan.name
            const featuresFr = toFeatures(plan.features)
            const featuresAr = toFeatures(plan.features_ar)
            const features =
              locale === "ar" && featuresAr.length ? featuresAr : featuresFr
            const discount = planDiscountPercent(
              plan.original_price,
              plan.price,
            )
            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-2xl border bg-card p-5 shadow-card",
                  plan.is_active ? "border-border" : "border-border opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {planName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {plan.is_active ? (
                        <Badge variant="verified" className="text-[10px]">
                          {t("active")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          {t("inactive")}
                        </Badge>
                      )}
                      {plan.is_popular && (
                        <Badge variant="featured" className="text-[10px]">
                          {t("popularTag")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
                  {discount > 0 && (
                    <span className="text-sm text-muted-foreground line-through tabular-nums">
                      {format.number(plan.original_price)}
                    </span>
                  )}
                  <span className="font-display text-2xl font-bold text-moroccan-red-600">
                    {format.number(plan.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t("currency")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    / {t("durationDays", { days: plan.duration_days })}
                  </span>
                  {discount > 0 && (
                    <Badge variant="featured" className="text-[10px]">
                      {t("discountBadge", { percent: discount })}
                    </Badge>
                  )}
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {plan.price === 0
                    ? t("freeDefault")
                    : t("maxAnnonces", { count: plan.max_annonces })}
                </p>

                {features.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
                    {features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-foreground/90"
                      >
                        <Check
                          className="size-4 shrink-0 text-moroccan-mint-500"
                          aria-hidden="true"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex items-center justify-end gap-1 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => onToggle(plan)}
                    disabled={pendingId === plan.id}
                    className={cn(
                      "inline-flex items-center justify-center size-9 rounded-lg hover:bg-moroccan-sand-50 disabled:opacity-50",
                      plan.is_active
                        ? "text-moroccan-mint-500"
                        : "text-muted-foreground",
                    )}
                    aria-label={plan.is_active ? t("deactivate") : t("activate")}
                    title={plan.is_active ? t("deactivate") : t("activate")}
                  >
                    <Power className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(plan)
                      setCreateOpen(true)
                    }}
                    className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700"
                    aria-label={t("form.edit")}
                    title={t("form.edit")}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(plan)}
                    disabled={pendingId === plan.id}
                    className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-red-50 hover:text-moroccan-red-600 disabled:opacity-50"
                    aria-label={t("delete")}
                    title={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <PlanFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={editing}
      />
    </div>
  )
}

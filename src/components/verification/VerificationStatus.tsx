"use client"

import { AlertTriangle, Clock, ShieldCheck } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

import { VerificationStepper } from "@/components/verification/VerificationStepper"
import { cn } from "@/lib/utils"

type Props =
  | { kind: "verified"; verifiedAt: string | null }
  | { kind: "pending"; submittedAt: string }
  | {
      kind: "rejected"
      submittedAt: string
      reason: string | null
      onResubmit?: () => void
    }

export function VerificationStatus(props: Props) {
  const t = useTranslations("verification")
  const format = useFormatter()

  const stepperLabels = {
    info: t("stepper.info"),
    documents: t("stepper.documents"),
    review: t("stepper.review"),
    approved: t("stepper.approved"),
  }

  if (props.kind === "verified") {
    return (
      <div className="rounded-2xl border border-moroccan-mint-500/30 bg-moroccan-mint-500/5 p-6 shadow-card space-y-4">
        <header className="flex items-start gap-4">
          <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-moroccan-mint-500 text-white shrink-0">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-foreground">
              {t("status.verifiedTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("status.verifiedDesc")}
            </p>
            {props.verifiedAt && (
              <p className="text-xs text-moroccan-mint-500 mt-2">
                {t("status.verifiedAt", {
                  date: format.dateTime(new Date(props.verifiedAt), {
                    dateStyle: "long",
                  }),
                })}
              </p>
            )}
          </div>
        </header>
        <VerificationStepper current="approved" labels={stepperLabels} />
      </div>
    )
  }

  if (props.kind === "pending") {
    return (
      <div className="rounded-2xl border border-moroccan-gold-500/40 bg-moroccan-gold-50/60 p-6 shadow-card space-y-4">
        <header className="flex items-start gap-4">
          <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-moroccan-gold-500 text-white shrink-0">
            <Clock className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-foreground">
              {t("status.pendingTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("status.pendingDesc", {
                date: format.dateTime(new Date(props.submittedAt), {
                  dateStyle: "long",
                }),
              })}
            </p>
            <p className="text-xs text-moroccan-gold-700 mt-2">
              {t("reviewTimeline")}
            </p>
          </div>
        </header>
        <VerificationStepper current="review" labels={stepperLabels} />
      </div>
    )
  }

  // Rejected
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-card space-y-4">
      <header className="flex items-start gap-4">
        <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-destructive text-white shrink-0">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold text-foreground">
            {t("status.rejectedTitle")}
          </h2>
          {props.reason && (
            <p className="text-sm text-foreground/90 mt-1">
              {t("status.rejectedReason", { reason: props.reason })}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {t("status.rejectedDesc")}
          </p>
        </div>
        {props.onResubmit && (
          <button
            type="button"
            onClick={props.onResubmit}
            className={cn(
              "inline-flex items-center h-10 px-4 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 shrink-0",
            )}
          >
            {t("status.resubmit")}
          </button>
        )}
      </header>
    </div>
  )
}
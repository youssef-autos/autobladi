"use client"

import { useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  approveSubscription,
  getSignedReceiptUrl,
  rejectSubscription,
} from "@/app/[locale]/admin/subscriptions/pending/actions"
import { RejectDialog } from "@/components/admin/RejectDialog"
import { SignedUrlButton } from "@/components/admin/SignedUrlButton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatPrice } from "@/lib/utils/format"
import type { SubscriptionReviewRow } from "@/lib/queries/admin"
import type { Locale } from "@/i18n/routing"

type Props = {
  row: SubscriptionReviewRow
}

function initials(name?: string | null): string {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function SubscriptionRow({ row }: Props) {
  const t = useTranslations("adminPanel.subscriptionsQueue")
  const format = useFormatter()
  const locale = useLocale() as Locale
  const [pending, startTransition] = useTransition()
  const [rejectOpen, setRejectOpen] = useState(false)

  const planName =
    locale === "ar" && row.plan?.name_ar ? row.plan.name_ar : (row.plan?.name ?? "—")

  function handleApprove() {
    startTransition(async () => {
      const res = await approveSubscription(row.id)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.approved"))
    })
  }

  function handleReject(reason: string) {
    startTransition(async () => {
      const res = await rejectSubscription({ id: row.id, reason })
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.rejected"))
      setRejectOpen(false)
    })
  }

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-moroccan-sand-50/50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-9 shrink-0">
              {row.user?.avatar_url && (
                <AvatarImage src={row.user.avatar_url} alt={row.user.full_name ?? ""} />
              )}
              <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-sm font-semibold">
                {initials(row.user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium text-foreground truncate">
              {row.user?.full_name ?? "—"}
            </p>
          </div>
        </td>

        <td className="px-4 py-3 text-sm text-foreground">
          <p className="font-medium">{planName}</p>
          {row.plan?.duration_days && (
            <p className="text-xs text-muted-foreground">
              {row.plan.duration_days} {locale === "ar" ? "يوم" : "j"}
            </p>
          )}
        </td>

        <td className="px-4 py-3 text-sm font-semibold tabular-nums">
          {formatPrice(row.amount, locale)}
        </td>

        <td className="px-4 py-3 text-xs text-muted-foreground font-mono tabular-nums truncate max-w-[150px]">
          {row.bank_reference ?? "—"}
        </td>

        <td className="px-4 py-3">
          <SignedUrlButton
            path={row.receipt_url}
            fetcher={getSignedReceiptUrl}
            label={t("viewReceipt")}
            errorMessage={t("toast.linkError")}
          />
        </td>

        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
          {format.relativeTime(new Date(row.created_at), new Date())}
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={handleApprove}
              disabled={pending}
              aria-label={t("approve")}
              className="inline-flex items-center justify-center size-9 rounded-lg bg-moroccan-mint-500/10 text-moroccan-mint-500 hover:bg-moroccan-mint-500/20 disabled:opacity-50"
            >
              <Check className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setRejectOpen(true)}
              disabled={pending}
              aria-label={t("reject")}
              className="inline-flex items-center justify-center size-9 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>
        </td>
      </tr>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t("rejectDialogTitle")}
        reasonLabel={t("rejectReason")}
        pending={pending}
        onConfirm={handleReject}
      />
    </>
  )
}

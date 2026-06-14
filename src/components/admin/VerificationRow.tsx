"use client"

import { useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  approveVerification,
  getSignedVerificationUrl,
  rejectVerification,
} from "@/app/[locale]/admin/verification/actions"
import { RejectDialog } from "@/components/admin/RejectDialog"
import { SignedUrlButton } from "@/components/admin/SignedUrlButton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { VerificationReviewRow } from "@/lib/queries/admin"

type Props = {
  row: VerificationReviewRow
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

export function VerificationRow({ row }: Props) {
  const t = useTranslations("adminPanel.verificationQueue")
  const format = useFormatter()
  const [pending, startTransition] = useTransition()
  const [rejectOpen, setRejectOpen] = useState(false)

  function handleApprove() {
    startTransition(async () => {
      const res = await approveVerification(row.id)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.approved"))
    })
  }

  function handleReject(reason: string) {
    startTransition(async () => {
      const res = await rejectVerification({ id: row.id, reason })
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
          <p className="font-medium">{row.company_name}</p>
          {row.manager_name && (
            <p className="text-xs text-muted-foreground">{row.manager_name}</p>
          )}
        </td>

        <td className="px-4 py-3 text-sm text-foreground tabular-nums">
          {row.rc_number ?? "—"}
        </td>

        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            <SignedUrlButton
              path={row.rc_document_url}
              fetcher={getSignedVerificationUrl}
              label={t("viewRc")}
              errorMessage={t("toast.linkError")}
            />
            <SignedUrlButton
              path={row.id_card_url}
              fetcher={getSignedVerificationUrl}
              label={t("viewIdCard")}
              errorMessage={t("toast.linkError")}
            />
          </div>
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

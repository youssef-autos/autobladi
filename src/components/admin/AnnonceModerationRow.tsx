"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Camera, Check, ExternalLink, X } from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  approveAnnonce,
  rejectAnnonce,
} from "@/app/[locale]/admin/annonces/pending/actions"
import { Link } from "@/i18n/navigation"
import { RejectDialog } from "@/components/admin/RejectDialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PriceTag } from "@/components/ui/PriceTag"
import type { PendingAnnonceRow } from "@/lib/queries/admin"
import type { Locale } from "@/i18n/routing"

type Props = {
  row: PendingAnnonceRow
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

export function AnnonceModerationRow({ row }: Props) {
  const t = useTranslations("adminPanel.annoncesQueue")
  const format = useFormatter()
  const locale = useLocale() as Locale
  const [pending, startTransition] = useTransition()
  const [rejectOpen, setRejectOpen] = useState(false)

  const submitted = format.relativeTime(new Date(row.created_at), new Date())
  const cityName = row.city
    ? locale === "ar"
      ? row.city.name_ar
      : row.city.name_fr
    : null

  function handleApprove() {
    startTransition(async () => {
      const res = await approveAnnonce(row.id)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.approved"))
    })
  }

  function handleReject(reason: string) {
    startTransition(async () => {
      const res = await rejectAnnonce({ id: row.id, reason })
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
            <div className="relative size-14 rounded-lg bg-moroccan-sand-50 overflow-hidden shrink-0">
              {row.main_image ? (
                <Image
                  src={row.main_image}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-moroccan-sand-200">
                  <Camera className="size-5" strokeWidth={1.2} />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{row.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {row.brand?.name}
                {row.model ? ` · ${row.model.name}` : ""}
                {cityName ? ` · ${cityName}` : ""}
              </p>
            </div>
          </div>
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="size-8 shrink-0">
              {row.user?.avatar_url && (
                <AvatarImage src={row.user.avatar_url} alt={row.user.full_name ?? ""} />
              )}
              <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-xs font-semibold">
                {initials(row.user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-foreground truncate">
              {row.user?.full_name ?? "—"}
            </p>
          </div>
        </td>

        <td className="px-4 py-3">
          <PriceTag price={row.price} size="sm" />
        </td>

        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
          {submitted}
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/annonces/${row.slug}`}
              target="_blank"
              className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground"
              aria-label={t("preview")}
            >
              <ExternalLink className="size-4" />
            </Link>
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
        placeholder={t("rejectReasonPlaceholder")}
        pending={pending}
        onConfirm={handleReject}
      />
    </>
  )
}

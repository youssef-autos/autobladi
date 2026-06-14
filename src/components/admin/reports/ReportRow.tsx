"use client"

import { useTransition } from "react"
import Image from "next/image"
import {
  Ban,
  Camera,
  CheckCircle2,
  ExternalLink,
  MoreHorizontal,
  XCircle,
} from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  dismissReport,
  resolveReport,
  takedownAnnonceFromReport,
} from "@/app/[locale]/admin/reports/actions"
import { Link } from "@/i18n/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AdminReportRow } from "@/lib/queries/admin"
import type { RequestStatus } from "@/types/database.types"

type Props = {
  row: AdminReportRow
}

const KNOWN_REASONS = [
  "fake",
  "scam",
  "wrong_category",
  "sold",
  "inappropriate",
  "other",
]

const statusVariant: Record<RequestStatus, "featured" | "verified" | "outline"> = {
  pending: "featured",
  approved: "verified",
  rejected: "outline",
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

export function ReportRow({ row }: Props) {
  const t = useTranslations("adminPanel.reportsPage")
  const tReasons = useTranslations("annonceDetail.report.reasons")
  const format = useFormatter()
  const [pending, startTransition] = useTransition()

  const reasonLabel = KNOWN_REASONS.includes(row.reason)
    ? tReasons(row.reason)
    : row.reason

  function run(fn: () => Promise<{ ok: boolean }>, successMsg: string) {
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(successMsg)
    })
  }

  function handleTakedown() {
    if (!row.annonce) return
    if (!window.confirm(t("takedownConfirm", { title: row.annonce.title })))
      return
    run(
      () =>
        takedownAnnonceFromReport({
          reportId: row.id,
          annonceId: row.annonce!.id,
        }),
      t("toast.takendown"),
    )
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-moroccan-sand-50/50 transition-colors">
      {/* Annonce */}
      <td className="px-4 py-3">
        {row.annonce ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative size-12 rounded-lg bg-moroccan-sand-50 overflow-hidden shrink-0">
              {row.annonce.main_image ? (
                <Image
                  src={row.annonce.main_image}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-moroccan-sand-200">
                  <Camera className="size-4" strokeWidth={1.2} />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {row.annonce.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`annonceStatus.${row.annonce.status}`)}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{t("noAnnonce")}</span>
        )}
      </td>

      {/* Reporter */}
      <td className="px-4 py-3">
        {row.reporter ? (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="size-8 shrink-0">
              {row.reporter.avatar_url && (
                <AvatarImage
                  src={row.reporter.avatar_url}
                  alt={row.reporter.full_name ?? ""}
                />
              )}
              <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-xs font-semibold">
                {initials(row.reporter.full_name)}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-foreground truncate">
              {row.reporter.full_name ?? "—"}
            </p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            {t("anonymous")}
          </span>
        )}
      </td>

      {/* Reason */}
      <td className="px-4 py-3">
        <Badge variant="pro" className="text-[10px]">
          {reasonLabel}
        </Badge>
      </td>

      {/* Description */}
      <td className="px-4 py-3 max-w-[260px]">
        {row.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2" title={row.description}>
            {row.description}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge variant={statusVariant[row.status]} className="text-[10px]">
          {t(`statusLabels.${row.status}`)}
        </Badge>
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {format.dateTime(new Date(row.created_at), { dateStyle: "medium" })}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {row.annonce && (
            <Link
              href={`/annonces/${row.annonce.slug}`}
              target="_blank"
              className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground"
              aria-label={t("preview")}
              title={t("preview")}
            >
              <ExternalLink className="size-4" />
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t("columns.actions")}
              disabled={pending}
              className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground disabled:opacity-50"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {row.status !== "approved" && (
                <DropdownMenuItem
                  onClick={() =>
                    run(() => resolveReport(row.id), t("toast.resolved"))
                  }
                  disabled={pending}
                >
                  <CheckCircle2 className="size-4 me-2 text-moroccan-mint-500" />
                  {t("resolve")}
                </DropdownMenuItem>
              )}
              {row.status !== "rejected" && (
                <DropdownMenuItem
                  onClick={() =>
                    run(() => dismissReport(row.id), t("toast.dismissed"))
                  }
                  disabled={pending}
                >
                  <XCircle className="size-4 me-2" />
                  {t("dismiss")}
                </DropdownMenuItem>
              )}

              {row.annonce && row.annonce.status !== "rejected" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleTakedown}
                    disabled={pending}
                  >
                    <Ban className="size-4 me-2" />
                    {t("takedown")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}

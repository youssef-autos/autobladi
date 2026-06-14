"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Sparkles,
  Star,
  Trash2,
  XCircle,
} from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  approveAnnonceAdmin,
  deleteAnnonceAdmin,
  rejectAnnonceAdmin,
  setAnnonceStatus,
  toggleAnnonceFeatured,
} from "@/app/[locale]/admin/annonces/actions"
import { Link } from "@/i18n/navigation"
import { RejectDialog } from "@/components/admin/RejectDialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PriceTag } from "@/components/ui/PriceTag"
import type { AdminAnnonceRow as Row } from "@/lib/queries/admin"
import type { AnnonceStatus } from "@/types/database.types"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  row: Row
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

const statusVariant: Record<
  AnnonceStatus,
  "verified" | "featured" | "destructive" | "new" | "outline"
> = {
  active: "verified",
  pending: "featured",
  rejected: "destructive",
  sold: "new",
  expired: "outline",
  draft: "outline",
}

export function AdminAnnonceRow({ row }: Props) {
  const t = useTranslations("adminPanel.allAnnoncesPage")
  const format = useFormatter()
  const locale = useLocale() as Locale
  const [pending, startTransition] = useTransition()
  const [rejectOpen, setRejectOpen] = useState(false)

  const cityName = row.city
    ? locale === "ar"
      ? row.city.name_ar
      : row.city.name_fr
    : null

  function run(
    fn: () => Promise<{ ok: boolean }>,
    successMsg: string,
  ) {
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(successMsg)
    })
  }

  function handleReject(reason: string) {
    startTransition(async () => {
      const res = await rejectAnnonceAdmin({ id: row.id, reason })
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.rejected"))
      setRejectOpen(false)
    })
  }

  function handleDelete() {
    if (!window.confirm(t("deleteConfirm", { title: row.title }))) return
    run(() => deleteAnnonceAdmin(row.id), t("toast.deleted"))
  }

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-moroccan-sand-50/50 transition-colors">
        {/* Annonce */}
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
              {row.featured && (
                <span className="absolute top-0.5 start-0.5 inline-flex size-4 items-center justify-center rounded-full bg-moroccan-gold-500 text-white shadow">
                  <Sparkles className="size-2.5" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {row.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {row.brand?.name}
                {row.model ? ` · ${row.model.name}` : ""}
                {cityName ? ` · ${cityName}` : ""}
              </p>
            </div>
          </div>
        </td>

        {/* Seller */}
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

        {/* Price */}
        <td className="px-4 py-3">
          <PriceTag price={row.price} size="sm" />
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <Badge variant={statusVariant[row.status]} className="text-[10px]">
            {t(`statusLabels.${row.status}`)}
          </Badge>
        </td>

        {/* Views */}
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
            <Eye className="size-3.5" aria-hidden="true" />
            {row.views_count}
          </span>
        </td>

        {/* Date */}
        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
          {format.dateTime(new Date(row.created_at), { dateStyle: "medium" })}
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/annonces/${row.slug}`}
              target="_blank"
              className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground"
              aria-label={t("preview")}
              title={t("preview")}
            >
              <ExternalLink className="size-4" />
            </Link>

            <button
              type="button"
              onClick={() =>
                run(
                  () =>
                    toggleAnnonceFeatured({ id: row.id, featured: !row.featured }),
                  row.featured ? t("toast.unfeatured") : t("toast.featured"),
                )
              }
              disabled={pending}
              className={cn(
                "inline-flex items-center justify-center size-9 rounded-lg hover:bg-moroccan-sand-50 disabled:opacity-50",
                row.featured ? "text-moroccan-gold-500" : "text-muted-foreground",
              )}
              aria-label={row.featured ? t("unfeature") : t("feature")}
              title={row.featured ? t("unfeature") : t("feature")}
            >
              <Star className={cn("size-4", row.featured && "fill-current")} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={t("columns.actions")}
                disabled={pending}
                className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground disabled:opacity-50"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {row.status !== "active" && (
                  <DropdownMenuItem
                    onClick={() =>
                      run(() => approveAnnonceAdmin(row.id), t("toast.published"))
                    }
                    disabled={pending}
                  >
                    <CheckCircle2 className="size-4 me-2 text-moroccan-mint-500" />
                    {t("publish")}
                  </DropdownMenuItem>
                )}

                {row.status !== "rejected" && (
                  <DropdownMenuItem
                    onClick={() => setRejectOpen(true)}
                    disabled={pending}
                  >
                    <XCircle className="size-4 me-2 text-destructive" />
                    {t("reject")}
                  </DropdownMenuItem>
                )}

                {row.status === "active" && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        run(
                          () => setAnnonceStatus({ id: row.id, status: "sold" }),
                          t("toast.markedSold"),
                        )
                      }
                      disabled={pending}
                    >
                      <BadgeCheck className="size-4 me-2 text-blue-600" />
                      {t("markSold")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        run(
                          () => setAnnonceStatus({ id: row.id, status: "expired" }),
                          t("toast.markedExpired"),
                        )
                      }
                      disabled={pending}
                    >
                      <Clock className="size-4 me-2" />
                      {t("markExpired")}
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuItem
                  onClick={() =>
                    run(
                      () =>
                        toggleAnnonceFeatured({
                          id: row.id,
                          featured: !row.featured,
                        }),
                      row.featured ? t("toast.unfeatured") : t("toast.featured"),
                    )
                  }
                  disabled={pending}
                >
                  {row.featured ? (
                    <Star className="size-4 me-2" />
                  ) : (
                    <Sparkles className="size-4 me-2 text-moroccan-gold-700" />
                  )}
                  {row.featured ? t("unfeature") : t("feature")}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={pending}
                >
                  <Trash2 className="size-4 me-2" />
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

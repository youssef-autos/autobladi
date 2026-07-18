"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  deleteMyAnnonce,
  markAsSold,
  renewAnnonce,
  toggleFeatured,
} from "@/app/[locale]/dashboard/annonces/actions"
import { useUser } from "@/hooks/use-user"
import { Link } from "@/i18n/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PriceTag } from "@/components/ui/PriceTag"
import type { DashboardAnnonceRow } from "@/lib/queries/dashboard"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  row: DashboardAnnonceRow
}

const statusVariant: Record<
  DashboardAnnonceRow["status"],
  { variant: React.ComponentProps<typeof Badge>["variant"]; key: string }
> = {
  active: { variant: "verified", key: "active" },
  pending: { variant: "featured", key: "pending" },
  rejected: { variant: "destructive", key: "rejected" },
  expired: { variant: "outline", key: "expired" },
  sold: { variant: "pro", key: "sold" },
  draft: { variant: "secondary", key: "draft" },
}

export function AnnonceRow({ row }: Props) {
  const t = useTranslations("dashboard.annoncesPage")
  const locale = useLocale() as Locale
  const format = useFormatter()
  const { profile } = useUser()
  const isPro =
    profile?.account_type === "pro" || profile?.account_type === "admin"
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const statusInfo = statusVariant[row.status]
  const publishedDate = row.published_at
    ? format.dateTime(new Date(row.published_at), { day: "numeric", month: "short", year: "numeric" })
    : "—"

  function handleAction(fn: () => Promise<{ ok: boolean; error?: string }>, successKey: string) {
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t(`toast.${successKey}` as never))
    })
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-moroccan-sand-50/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative size-14 sm:size-16 rounded-lg bg-moroccan-sand-50 overflow-hidden shrink-0">
            {row.main_image ? (
              <Image
                src={row.main_image}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-moroccan-sand-200">
                <Camera className="size-5" strokeWidth={1.2} aria-hidden="true" />
              </span>
            )}
            {row.featured && (
              <span
                aria-hidden
                className="absolute -top-1 -end-1 inline-flex items-center justify-center size-4 rounded-full bg-moroccan-gold-500 ring-2 ring-background"
              >
                <Sparkles className="size-2.5 text-white" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{row.title}</p>
            <p className="text-xs text-muted-foreground">/{row.slug}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <PriceTag price={row.price} size="sm" />
      </td>

      <td className="px-4 py-3">
        <Badge variant={statusInfo.variant}>{t(`status.${statusInfo.key}` as never)}</Badge>
      </td>

      <td className="px-4 py-3 text-sm tabular-nums">{row.views_count}</td>

      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
        {publishedDate}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {row.status === "active" && (
            <Link
              href={`/annonces/${row.slug}`}
              className="hidden md:inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-moroccan-sand-50"
              aria-label={t("actions.view")}
            >
              <ExternalLink className="size-4" />
            </Link>
          )}
          <Link
            href={`/dashboard/modifier/${row.id}`}
            className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-moroccan-red-500 hover:bg-moroccan-red-50"
            aria-label={t("actions.edit")}
          >
            <Pencil className="size-4" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="more"
              className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-moroccan-sand-50"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {row.status === "active" && (
                <DropdownMenuItem
                  onClick={() => handleAction(() => markAsSold(row.id), "sold")}
                  disabled={pending}
                >
                  <CheckCircle2 className="size-4 me-2 text-moroccan-mint-500" />
                  {t("actions.markSold")}
                </DropdownMenuItem>
              )}
              {(row.status === "expired" || row.status === "active") && (
                <DropdownMenuItem
                  onClick={() => handleAction(() => renewAnnonce(row.id), "renewed")}
                  disabled={pending}
                >
                  <RotateCcw className="size-4 me-2 text-moroccan-red-500" />
                  {t("actions.renew")}
                </DropdownMenuItem>
              )}
              {isPro ? (
                <DropdownMenuItem
                  onClick={() =>
                    handleAction(
                      () => toggleFeatured(row.id),
                      row.featured ? "unfeatured" : "featured",
                    )
                  }
                  disabled={pending}
                >
                  <Sparkles
                    className={cn(
                      "size-4 me-2",
                      row.featured
                        ? "text-muted-foreground"
                        : "text-moroccan-gold-700",
                    )}
                  />
                  {row.featured ? t("actions.unfeature") : t("actions.feature")}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem render={<Link href="/dashboard/showroom" />}>
                  <Sparkles className="size-4 me-2 text-moroccan-gold-700" />
                  {t("actions.featureProOnly")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="size-4 me-2" />
                {t("actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
                <DialogDescription>{t("deleteConfirmDesc")}</DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmOpen(false)
                    handleAction(() => deleteMyAnnonce(row.id), "deleted")
                  }}
                  className={cn(
                    "inline-flex items-center justify-center h-10 px-4 rounded-xl bg-destructive text-white text-sm font-semibold hover:brightness-105",
                  )}
                >
                  {t("confirmDelete")}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {/* preserve unused locale binding so PriceTag respects RTL/LTR via context */}
        <span hidden aria-hidden>{locale}</span>
      </td>
    </tr>
  )
}

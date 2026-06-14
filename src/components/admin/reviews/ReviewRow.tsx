"use client"

import { useTransition } from "react"
import { Building2, Star, Trash2 } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"

import { deleteReview } from "@/app/[locale]/admin/reviews/actions"
import { Link } from "@/i18n/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { AdminReviewRow } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"

type Props = {
  row: AdminReviewRow
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

export function ReviewRow({ row }: Props) {
  const t = useTranslations("adminPanel.reviewsPage")
  const format = useFormatter()
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm(t("deleteConfirm"))) return
    startTransition(async () => {
      const res = await deleteReview(row.id)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.deleted"))
    })
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-moroccan-sand-50/50 transition-colors align-top">
      {/* Dealer */}
      <td className="px-4 py-3">
        {row.dealer ? (
          <Link
            href={`/professionnel/${row.dealer.slug}`}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-moroccan-sand-100">
              {row.dealer.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.dealer.logo_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <Building2 className="size-4 text-muted-foreground" />
              )}
            </span>
            <span className="text-sm font-medium text-foreground truncate group-hover:text-moroccan-red-600">
              {row.dealer.name}
            </span>
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>

      {/* Author */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="size-8 shrink-0">
            {row.author?.avatar_url && (
              <AvatarImage src={row.author.avatar_url} alt={row.author.full_name ?? ""} />
            )}
            <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-xs font-semibold">
              {initials(row.author?.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground truncate">
            {row.author?.full_name ?? "—"}
          </span>
        </div>
      </td>

      {/* Rating */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn(
                "size-3.5",
                n <= row.rating
                  ? "fill-moroccan-gold-500 text-moroccan-gold-500"
                  : "text-muted-foreground/30",
              )}
              strokeWidth={1.5}
            />
          ))}
        </div>
      </td>

      {/* Comment */}
      <td className="px-4 py-3 max-w-[360px]">
        {row.comment ? (
          <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">
            {row.comment}
          </p>
        ) : (
          <span className="text-sm text-muted-foreground italic">{t("noComment")}</span>
        )}
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {format.dateTime(new Date(row.created_at), { dateStyle: "medium" })}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            aria-label={t("delete")}
            title={t("delete")}
            className="inline-flex items-center justify-center size-9 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

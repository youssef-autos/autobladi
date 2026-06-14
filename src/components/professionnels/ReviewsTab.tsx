"use client"

import { MessageSquare, Star } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

import { ReviewForm } from "@/components/professionnels/ReviewForm"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/EmptyState"
import type { ReviewItem } from "@/lib/queries/professionnels"
import { cn } from "@/lib/utils"

type Props = {
  professionnelId: string
  averageRating: number
  reviewsCount: number
  reviews: ReviewItem[]
  hasAlreadyReviewed: boolean
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

export function ReviewsTab({
  professionnelId,
  averageRating,
  reviewsCount,
  reviews,
  hasAlreadyReviewed,
}: Props) {
  const t = useTranslations("professionnels.reviews")
  const format = useFormatter()

  // Compute distribution
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length
    const pct = reviewsCount > 0 ? (count / reviewsCount) * 100 : 0
    return { stars, count, pct }
  })

  return (
    <div className="space-y-6">
      {/* Add a review — or, when logged out, the login prompt. Sits between
          the "Avis" heading and the reviews card. */}
      <ReviewForm
        professionnelId={professionnelId}
        alreadyReviewed={hasAlreadyReviewed}
      />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-border">
          <div>
            <p className="font-display text-4xl font-bold tabular-nums text-foreground">
              {Number(averageRating).toFixed(1)}
              <span className="text-base text-muted-foreground font-normal">
                {" "}
                / 5
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("averageRating")} · {reviewsCount}
            </p>
          </div>

          <ul className="flex flex-col gap-1 min-w-[200px]">
            {distribution.map((row) => (
              <li
                key={row.stars}
                className="flex items-center gap-2 text-xs tabular-nums"
              >
                <span className="w-6 text-muted-foreground">{row.stars}</span>
                <Star
                  className="size-3.5 fill-moroccan-gold-500 text-moroccan-gold-500"
                  aria-hidden="true"
                />
                <div className="flex-1 h-1.5 rounded-full bg-moroccan-sand-50 overflow-hidden">
                  <div
                    className="h-full bg-moroccan-gold-500"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="w-6 text-end text-muted-foreground">{row.count}</span>
              </li>
            ))}
          </ul>
        </header>

        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={t("empty")}
            description={t("emptyDesc")}
          />
        ) : (
          <ul className="divide-y divide-border">
            {reviews.map((r) => (
              <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Avatar className="size-10 shrink-0">
                    {r.user.avatar_url && (
                      <AvatarImage src={r.user.avatar_url} alt={r.user.full_name ?? ""} />
                    )}
                    <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-sm font-semibold">
                      {initials(r.user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {r.user.full_name ?? "—"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format.dateTime(new Date(r.created_at), {
                          dateStyle: "medium",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={cn(
                            "size-3.5",
                            n <= r.rating
                              ? "fill-moroccan-gold-500 text-moroccan-gold-500"
                              : "text-muted-foreground/30",
                          )}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    {r.comment && (
                      <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap leading-relaxed">
                        {r.comment}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
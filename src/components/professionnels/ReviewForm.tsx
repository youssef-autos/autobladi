"use client"

import { useState, useTransition } from "react"
import { Star } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { addReview } from "@/app/[locale]/(main)/showroom/[slug]/actions"
import { Link } from "@/i18n/navigation"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

type Props = {
  professionnelId: string
  alreadyReviewed: boolean
}

export function ReviewForm({ professionnelId, alreadyReviewed }: Props) {
  const t = useTranslations("professionnels.reviews")
  const tNav = useTranslations("nav")
  const { user, loading } = useUser()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(alreadyReviewed)

  if (!loading && !user) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card text-center space-y-3">
        <p className="text-sm text-muted-foreground">{t("loginRequired")}</p>
        <Link
          href="/auth/connexion"
          className="inline-flex items-center h-10 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold hover:brightness-105"
        >
          {tNav("login")}
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-moroccan-mint-500/30 bg-moroccan-mint-500/5 p-6 text-center space-y-2">
        <p className="text-sm font-medium text-moroccan-mint-500">
          {t(alreadyReviewed ? "alreadyReviewed" : "successTitle")}
        </p>
        {!alreadyReviewed && (
          <p className="text-xs text-muted-foreground">{t("successDesc")}</p>
        )}
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) return
    startTransition(async () => {
      const result = await addReview({
        professionnelId,
        rating,
        comment: comment.trim() || undefined,
      })
      if (!result.ok) {
        toast.error(t(result.error === "already_reviewed" ? "alreadyReviewed" : "error"))
        return
      }
      toast.success(t("successTitle"), { description: t("successDesc") })
      setDone(true)
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4"
    >
      <h3 className="font-semibold text-foreground">{t("addYour")}</h3>

      <div>
        <p className="text-xs text-muted-foreground mb-2">{t("yourRating")}</p>
        <div
          className="flex gap-1"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hovered || rating) >= n
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                aria-label={`${n}`}
                className={cn(
                  "p-1 transition-colors rounded",
                  "hover:bg-moroccan-gold-50",
                )}
              >
                <Star
                  className={cn(
                    "size-7",
                    active
                      ? "fill-moroccan-gold-500 text-moroccan-gold-500"
                      : "text-muted-foreground/40",
                  )}
                  strokeWidth={1.5}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-2 block">
          {t("yourComment")}
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("commentPlaceholder")}
          maxLength={2000}
          rows={3}
          className="rounded-xl"
        />
      </div>

      <button
        type="submit"
        disabled={pending || rating < 1}
        className="inline-flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 disabled:opacity-60 transition-all"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  )
}

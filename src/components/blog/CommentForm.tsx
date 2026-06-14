"use client"

import { useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { X } from "lucide-react"

import { submitBlogComment } from "@/app/[locale]/(main)/blog/actions"
import { Link } from "@/i18n/navigation"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

type Props = {
  postId: string
  postSlug: string
  /** If set, this is a reply; we display the parent name and cancel button. */
  replyTo?: { id: string; name: string } | null
  onCancelReply?: () => void
  onPosted?: () => void
  className?: string
}

export function CommentForm({
  postId,
  postSlug,
  replyTo,
  onCancelReply,
  onPosted,
  className,
}: Props) {
  const t = useTranslations("blog.comments")
  const tForm = useTranslations("blog.comments.form")
  const locale = useLocale()
  const { user, loading } = useUser()
  const [content, setContent] = useState("")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return <div className="h-24 rounded-xl bg-muted animate-pulse" />
  }

  if (!user) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border bg-moroccan-sand-50/40 p-5 text-center text-sm",
          className,
        )}
      >
        <p className="text-foreground mb-2">{t("loginRequired")}</p>
        <Link
          href={`/auth/connexion?returnTo=/${locale}/blog/${postSlug}`}
          className="inline-flex items-center h-10 px-4 rounded-xl bg-moroccan-red-500 text-white text-sm font-semibold hover:bg-moroccan-red-600"
        >
          {t("loginCta")}
        </Link>
      </div>
    )
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await submitBlogComment(
        {
          postId,
          parentId: replyTo?.id ?? null,
          content: content.trim(),
        },
        postSlug,
      )
      if (!res.ok) {
        const key = res.message === "tooShort" ? "tooShort" : "errorTitle"
        const msg =
          key === "tooShort" ? tForm("tooShort") : tForm("errorTitle")
        setError(msg)
        toast.error(msg)
        return
      }
      toast.success(tForm("successTitle"), {
        description: tForm("successDesc"),
      })
      setContent("")
      onPosted?.()
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-card space-y-3",
        className,
      )}
    >
      {replyTo && (
        <div className="flex items-center justify-between gap-2 text-xs bg-moroccan-sand-50 rounded-lg px-3 py-2">
          <span className="text-foreground">
            {tForm("replyTo", { name: replyTo.name })}
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="inline-flex items-center gap-1 text-moroccan-red-500 hover:underline"
          >
            <X className="size-3" aria-hidden="true" />
            {tForm("cancelReply")}
          </button>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={tForm("placeholder")}
        rows={4}
        required
        minLength={3}
        maxLength={2000}
        className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60 resize-y"
      />

      {error && (
        <p role="alert" className="text-sm text-moroccan-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end">
        <MoroccanButton type="submit" size="sm" loading={pending}>
          {pending ? tForm("submitting") : tForm("submit")}
        </MoroccanButton>
      </div>
    </form>
  )
}

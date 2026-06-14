"use client"

import { useMemo, useState, useTransition } from "react"
import {
  Check,
  CornerDownRight,
  EyeOff,
  MessageSquare,
  Search,
  Trash2,
} from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  deleteComment,
  setCommentApproval,
} from "@/app/[locale]/admin/blog/comments/actions"
import { EmptyState } from "@/components/ui/EmptyState"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link } from "@/i18n/navigation"
import type { AdminBlogCommentRow } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"

type Props = {
  comments: AdminBlogCommentRow[]
}

type StatusFilter = "all" | "pending" | "approved"

const TABS: StatusFilter[] = ["all", "pending", "approved"]

function initials(name?: string | null): string {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function BlogCommentsManager({ comments }: Props) {
  const t = useTranslations("adminPanel.blogCommentsPage")
  const format = useFormatter()
  const [status, setStatus] = useState<StatusFilter>("pending")
  const [q, setQ] = useState("")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const counts = useMemo(() => {
    let approved = 0
    for (const c of comments) if (c.is_approved) approved++
    return { all: comments.length, approved, pending: comments.length - approved }
  }, [comments])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return comments.filter((c) => {
      if (status === "approved" && !c.is_approved) return false
      if (status === "pending" && c.is_approved) return false
      if (!needle) return true
      return (
        c.content.toLowerCase().includes(needle) ||
        (c.author?.full_name ?? "").toLowerCase().includes(needle) ||
        (c.post?.title ?? "").toLowerCase().includes(needle)
      )
    })
  }, [comments, status, q])

  function onApproval(comment: AdminBlogCommentRow, approved: boolean) {
    setPendingId(comment.id)
    startTransition(async () => {
      const res = await setCommentApproval({ id: comment.id, approved })
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(approved ? t("toast.approved") : t("toast.hidden"))
    })
  }

  function onDelete(comment: AdminBlogCommentRow) {
    if (!window.confirm(t("deleteConfirm"))) return
    setPendingId(comment.id)
    startTransition(async () => {
      const res = await deleteComment(comment.id)
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.deleted"))
    })
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search")}
          className="w-full h-11 ps-10 pe-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"
        />
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {TABS.map((s) => {
          const count = counts[s]
          const isActive = status === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm font-medium transition-colors",
                isActive
                  ? "border-moroccan-red-500/40 bg-moroccan-red-50 text-moroccan-red-600"
                  : "border-border bg-card text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground",
              )}
            >
              {t(`statusTabs.${s}`)}
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] tabular-nums",
                  isActive
                    ? "bg-moroccan-red-500 text-white"
                    : "bg-moroccan-sand-100 text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {comments.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={MessageSquare}
            title={t("empty")}
            description={t("emptyDesc")}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-8 shadow-card text-center text-sm text-muted-foreground">
          {t("noResults")}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const busy = pendingId === c.id
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="size-9 shrink-0">
                    {c.author?.avatar_url && (
                      <AvatarImage
                        src={c.author.avatar_url}
                        alt={c.author.full_name ?? ""}
                      />
                    )}
                    <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-xs font-semibold">
                      {initials(c.author?.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    {/* Meta line */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {c.author?.full_name ?? "—"}
                      </span>
                      {c.is_reply && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CornerDownRight className="size-3" />
                          {t("reply")}
                        </span>
                      )}
                      {c.is_approved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-moroccan-mint-500/10 px-2 py-0.5 text-[11px] font-medium text-moroccan-mint-600">
                          {t("statusTabs.approved")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-moroccan-gold-500/15 px-2 py-0.5 text-[11px] font-medium text-moroccan-gold-700">
                          {t("statusTabs.pending")}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format.dateTime(new Date(c.created_at), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    {/* Comment body */}
                    <p className="mt-1.5 text-sm text-foreground/90 whitespace-pre-wrap break-words">
                      {c.content}
                    </p>

                    {/* Post link */}
                    {c.post && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("onPost")}{" "}
                        <Link
                          href={`/blog/${c.post.slug}`}
                          className="font-medium text-moroccan-red-600 hover:underline"
                        >
                          {c.post.title}
                        </Link>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    {c.is_approved ? (
                      <button
                        type="button"
                        onClick={() => onApproval(c, false)}
                        disabled={busy}
                        title={t("hide")}
                        aria-label={t("hide")}
                        className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700 disabled:opacity-50"
                      >
                        <EyeOff className="size-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onApproval(c, true)}
                        disabled={busy}
                        title={t("approve")}
                        aria-label={t("approve")}
                        className="inline-flex items-center justify-center size-9 rounded-lg bg-moroccan-mint-500/10 text-moroccan-mint-600 hover:bg-moroccan-mint-500/20 disabled:opacity-50"
                      >
                        <Check className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(c)}
                      disabled={busy}
                      title={t("delete")}
                      aria-label={t("delete")}
                      className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-red-50 hover:text-moroccan-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

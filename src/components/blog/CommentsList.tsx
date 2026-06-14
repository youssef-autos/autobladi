"use client"

import { useMemo, useState } from "react"
import { Reply } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

import { CommentForm } from "@/components/blog/CommentForm"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GoldAccent } from "@/components/ui/GoldAccent"
import type { BlogComment } from "@/lib/queries/blog"
import { cn } from "@/lib/utils"

type Props = {
  postId: string
  postSlug: string
  comments: BlogComment[]
}

type SortKey = "newest" | "oldest"

function initials(name?: string | null): string {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * One-level nested thread. Top-level comments are sorted by the user's
 * choice; replies are always shown oldest-first inside their parent.
 */
export function CommentsList({ postId, postSlug, comments }: Props) {
  const t = useTranslations("blog.comments")
  const fmt = useFormatter()
  const [sort, setSort] = useState<SortKey>("newest")
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null,
  )

  const { topLevel, replyMap } = useMemo(() => {
    const top: BlogComment[] = []
    const map = new Map<string, BlogComment[]>()
    for (const c of comments) {
      if (c.parent_id) {
        const arr = map.get(c.parent_id) ?? []
        arr.push(c)
        map.set(c.parent_id, arr)
      } else {
        top.push(c)
      }
    }
    // Sort replies oldest-first
    for (const arr of map.values()) {
      arr.sort((a, b) => a.created_at.localeCompare(b.created_at))
    }
    top.sort((a, b) =>
      sort === "newest"
        ? b.created_at.localeCompare(a.created_at)
        : a.created_at.localeCompare(b.created_at),
    )
    return { topLevel: top, replyMap: map }
  }, [comments, sort])

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("count", { count: comments.length })}
          </p>
          <GoldAccent className="mt-2" />
        </div>

        {topLevel.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <SortBtn active={sort === "newest"} onClick={() => setSort("newest")}>
              {t("sort.newest")}
            </SortBtn>
            <SortBtn active={sort === "oldest"} onClick={() => setSort("oldest")}>
              {t("sort.oldest")}
            </SortBtn>
          </div>
        )}
      </header>

      <CommentForm
        postId={postId}
        postSlug={postSlug}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onPosted={() => setReplyTo(null)}
      />

      {comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          {t("empty")}
        </p>
      ) : (
        <ul className="space-y-5">
          {topLevel.map((c) => (
            <li key={c.id}>
              <CommentItem
                comment={c}
                onReply={(name) => setReplyTo({ id: c.id, name })}
              />
              {(replyMap.get(c.id) ?? []).length > 0 && (
                <ul className="ms-12 mt-4 space-y-4 border-s-2 border-moroccan-sand-50 ps-4">
                  {(replyMap.get(c.id) ?? []).map((reply) => (
                    <li key={reply.id}>
                      <CommentItem comment={reply} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="sr-only" aria-live="polite">
        {fmt.dateTime(new Date(), { dateStyle: "long" })}
      </div>
    </section>
  )
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: BlogComment
  onReply?: (name: string) => void
}) {
  const t = useTranslations("blog.comments.actions")
  const fmt = useFormatter()
  const name = comment.user?.full_name ?? "—"
  return (
    <article className="flex gap-3">
      <Avatar className="size-10 shrink-0">
        {comment.user?.avatar_url && (
          <AvatarImage src={comment.user.avatar_url} alt={name} />
        )}
        <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-sm font-semibold">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold text-sm text-foreground truncate">
            {name}
          </span>
          <span className="text-xs text-muted-foreground">
            {fmt.relativeTime(new Date(comment.created_at), new Date())}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-foreground/90 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        {onReply && (
          <button
            type="button"
            onClick={() => onReply(name)}
            className="inline-flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-moroccan-red-500"
          >
            <Reply className="size-3.5 rtl:scale-x-[-1]" aria-hidden="true" />
            {t("reply")}
          </button>
        )}
      </div>
    </article>
  )
}

function SortBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 px-3 rounded-full border text-xs font-medium",
        active
          ? "bg-moroccan-red-500 text-white border-transparent"
          : "bg-card border-border text-foreground hover:bg-moroccan-sand-50",
      )}
    >
      {children}
    </button>
  )
}

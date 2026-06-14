"use client"

import { useMemo, useState, useTransition } from "react"
import {
  Eye,
  EyeOff,
  MessageSquare,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  deleteBlogPost,
  toggleBlogPostPublish,
} from "@/app/[locale]/admin/blog/actions"
import { EmptyState } from "@/components/ui/EmptyState"
import { Link } from "@/i18n/navigation"
import type { AdminBlogPostRow } from "@/lib/queries/admin"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  posts: AdminBlogPostRow[]
}

type StatusFilter = "all" | "published" | "draft"

const TABS: StatusFilter[] = ["all", "published", "draft"]

export function BlogPostsManager({ posts }: Props) {
  const t = useTranslations("adminPanel.blogPostsPage")
  const format = useFormatter()
  const locale = useLocale() as Locale
  const [status, setStatus] = useState<StatusFilter>("all")
  const [q, setQ] = useState("")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const counts = useMemo(() => {
    let published = 0
    for (const p of posts) if (p.is_published) published++
    return { all: posts.length, published, draft: posts.length - published }
  }, [posts])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return posts.filter((p) => {
      if (status === "published" && !p.is_published) return false
      if (status === "draft" && p.is_published) return false
      if (!needle) return true
      return (
        p.title.toLowerCase().includes(needle) ||
        p.slug.toLowerCase().includes(needle)
      )
    })
  }, [posts, status, q])

  function onTogglePublish(post: AdminBlogPostRow) {
    setPendingId(post.id)
    startTransition(async () => {
      const res = await toggleBlogPostPublish({
        id: post.id,
        publish: !post.is_published,
      })
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(post.is_published ? t("toast.unpublished") : t("toast.published"))
    })
  }

  function onDelete(post: AdminBlogPostRow) {
    if (!window.confirm(t("deleteConfirm", { title: post.title }))) return
    setPendingId(post.id)
    startTransition(async () => {
      const res = await deleteBlogPost(post.id)
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
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="w-full h-11 ps-10 pe-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"
          />
        </div>

        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
        >
          <Plus className="size-4" />
          {t("newPost")}
        </Link>
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

      {/* Table */}
      {posts.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={Newspaper}
            title={t("empty")}
            description={t("emptyDesc")}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-8 shadow-card text-center text-sm text-muted-foreground">
          {t("noResults")}
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3 min-w-[260px]">
                    {t("columns.post")}
                  </th>
                  <th className="text-start px-4 py-3">{t("columns.category")}</th>
                  <th className="text-start px-4 py-3">{t("columns.status")}</th>
                  <th className="text-start px-4 py-3">{t("columns.stats")}</th>
                  <th className="text-start px-4 py-3">{t("columns.date")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr
                    key={post.id}
                    className="border-t border-border hover:bg-moroccan-sand-50/40"
                  >
                    {/* Post (cover + title) */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-moroccan-sand-100">
                          {post.cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.cover_image}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <Newspaper className="size-4 text-muted-foreground" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {post.title}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground truncate">
                            {post.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-sm text-foreground">
                      {post.category
                        ? locale === "ar"
                          ? post.category.name_ar
                          : post.category.name_fr
                        : "—"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {post.is_published ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-moroccan-mint-500/10 px-2.5 py-1 text-xs font-medium text-moroccan-mint-600">
                          <span className="size-1.5 rounded-full bg-moroccan-mint-500" />
                          {t("statusTabs.published")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-moroccan-sand-100 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                          {t("statusTabs.draft")}
                        </span>
                      )}
                    </td>

                    {/* Stats */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="size-3.5" />
                          {post.views_count}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="size-3.5" />
                          {post.comments_count}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format.dateTime(
                        new Date(post.published_at ?? post.created_at),
                        { dateStyle: "medium" },
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onTogglePublish(post)}
                          disabled={pendingId === post.id}
                          title={
                            post.is_published ? t("unpublish") : t("publish")
                          }
                          aria-label={
                            post.is_published ? t("unpublish") : t("publish")
                          }
                          className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-mint-600 disabled:opacity-50"
                        >
                          {post.is_published ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                        <Link
                          href={`/admin/blog/edit/${post.id}`}
                          title={t("edit")}
                          aria-label={t("edit")}
                          className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(post)}
                          disabled={pendingId === post.id}
                          title={t("delete")}
                          aria-label={t("delete")}
                          className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-red-50 hover:text-moroccan-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

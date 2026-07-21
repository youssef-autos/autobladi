"use client"

import { useMemo, useState, useTransition } from "react"
import { Layers, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { deleteBlogCategory } from "@/app/[locale]/admin/blog/categories/actions"
import { BlogCategoryFormDialog } from "@/components/admin/blog/categories/BlogCategoryFormDialog"
import { EmptyState } from "@/components/ui/EmptyState"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import type { AdminBlogCategoryRow } from "@/lib/queries/admin"

type Props = {
  categories: AdminBlogCategoryRow[]
}

export function BlogCategoriesManager({ categories }: Props) {
  const t = useTranslations("adminPanel.blogCategoriesPage")
  const [q, setQ] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<AdminBlogCategoryRow | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    if (!q.trim()) return categories
    const needle = q.trim().toLowerCase()
    return categories.filter(
      (c) =>
        c.name_ar.toLowerCase().includes(needle) ||
        c.name_fr.toLowerCase().includes(needle) ||
        c.slug.toLowerCase().includes(needle),
    )
  }, [categories, q])

  function onDelete(cat: AdminBlogCategoryRow) {
    if (!window.confirm(t("deleteConfirm", { name: cat.name_fr }))) return
    setPendingId(cat.id)
    startTransition(async () => {
      const res = await deleteBlogCategory(cat.id)
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.deleted"))
    })
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search
            className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="w-full h-11 ps-10 pe-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"
          />
        </div>

        <MoroccanButton
          type="button"
          onClick={() => {
            setEditing(null)
            setCreateOpen(true)
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("addManual")}
        </MoroccanButton>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("count", { count: categories.length })}
      </p>

      {/* Table */}
      {categories.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState icon={Layers} title={t("empty")} description={t("emptyDesc")} />
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
                  <th className="text-start px-4 py-3">{t("columns.nameAr")}</th>
                  <th className="text-start px-4 py-3">{t("columns.nameFr")}</th>
                  <th className="text-start px-4 py-3">{t("columns.slug")}</th>
                  <th className="text-start px-4 py-3 w-24">{t("columns.posts")}</th>
                  <th className="text-start px-4 py-3 w-20">{t("columns.order")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr
                    key={cat.id}
                    className="border-t border-border hover:bg-moroccan-sand-50/40"
                  >
                    <td className="px-4 py-3 text-sm text-foreground" dir="rtl">
                      {cat.name_ar}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {cat.name_fr}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {cat.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center min-w-7 h-6 px-2 rounded-full bg-moroccan-sand-100 text-xs font-medium text-muted-foreground tabular-nums">
                        {cat.posts_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                      {cat.order_index}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(cat)
                            setCreateOpen(true)
                          }}
                          className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700"
                          aria-label={t("edit")}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(cat)}
                          disabled={pendingId === cat.id}
                          className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-red-50 hover:text-moroccan-red-600 disabled:opacity-50"
                          aria-label={t("delete")}
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

      <BlogCategoryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={editing}
      />
    </div>
  )
}

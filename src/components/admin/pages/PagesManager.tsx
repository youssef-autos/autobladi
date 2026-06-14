"use client"

import { useState, useTransition } from "react"
import {
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { deletePage, togglePagePublish } from "@/app/[locale]/admin/pages/actions"
import { EmptyState } from "@/components/ui/EmptyState"
import { Link } from "@/i18n/navigation"
import type { AdminPageRow } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"

type Props = {
  pages: AdminPageRow[]
}

export function PagesManager({ pages }: Props) {
  const t = useTranslations("adminPanel.pagesPage")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function onToggle(page: AdminPageRow) {
    setPendingId(page.id)
    startTransition(async () => {
      const res = await togglePagePublish({ id: page.id, publish: !page.is_published })
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(page.is_published ? t("toast.unpublished") : t("toast.published"))
    })
  }

  function onDelete(page: AdminPageRow) {
    if (!window.confirm(t("deleteConfirm", { title: page.title_fr }))) return
    setPendingId(page.id)
    startTransition(async () => {
      const res = await deletePage(page.id)
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
      <div className="flex items-center justify-end">
        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
        >
          <Plus className="size-4" />
          {t("newPage")}
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState icon={FileText} title={t("empty")} description={t("emptyDesc")} />
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3">{t("columns.title")}</th>
                  <th className="text-start px-4 py-3">{t("columns.slug")}</th>
                  <th className="text-start px-4 py-3">{t("columns.status")}</th>
                  <th className="text-start px-4 py-3 w-20">{t("columns.footer")}</th>
                  <th className="text-start px-4 py-3 w-16">{t("columns.order")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr
                    key={page.id}
                    className="border-t border-border hover:bg-moroccan-sand-50/40"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {page.title_fr}
                      </p>
                      <p className="text-xs text-muted-foreground" dir="rtl">
                        {page.title_ar}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/p/${page.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-moroccan-red-600"
                      >
                        /p/{page.slug}
                        <ExternalLink className="size-3" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {page.is_published ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-moroccan-mint-500/10 px-2.5 py-1 text-xs font-medium text-moroccan-mint-600">
                          <span className="size-1.5 rounded-full bg-moroccan-mint-500" />
                          {t("statusPublished")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-moroccan-sand-100 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                          {t("statusDraft")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {page.show_in_footer ? "✓" : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                      {page.order_index}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onToggle(page)}
                          disabled={pendingId === page.id}
                          title={page.is_published ? t("unpublish") : t("publish")}
                          aria-label={page.is_published ? t("unpublish") : t("publish")}
                          className={cn(
                            "inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-mint-600 disabled:opacity-50",
                          )}
                        >
                          {page.is_published ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                        <Link
                          href={`/admin/pages/edit/${page.id}`}
                          title={t("edit")}
                          aria-label={t("edit")}
                          className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(page)}
                          disabled={pendingId === page.id}
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

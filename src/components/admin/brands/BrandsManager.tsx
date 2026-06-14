"use client"

import { useMemo, useState, useTransition } from "react"
import { Car, Pencil, Plus, Power, Search, Trash2, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  deleteBrand,
  toggleBrandActive,
} from "@/app/[locale]/admin/brands/actions"
import { BrandFormDialog } from "@/components/admin/brands/BrandFormDialog"
import { BrandImportDialog } from "@/components/admin/brands/BrandImportDialog"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/EmptyState"
import type { AdminBrandRow } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"

type Props = {
  brands: AdminBrandRow[]
}

export function BrandsManager({ brands }: Props) {
  const t = useTranslations("adminPanel.brandsPage")
  const [q, setQ] = useState("")
  const [showInactive, setShowInactive] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<AdminBrandRow | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    let rows = brands
    if (!showInactive) rows = rows.filter((b) => b.is_active)
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      rows = rows.filter(
        (b) =>
          b.name.toLowerCase().includes(needle) ||
          b.slug.toLowerCase().includes(needle),
      )
    }
    return rows
  }, [brands, q, showInactive])

  function onToggle(brand: AdminBrandRow) {
    setPendingId(brand.id)
    startTransition(async () => {
      const res = await toggleBrandActive({
        id: brand.id,
        is_active: !brand.is_active,
      })
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(
        brand.is_active
          ? t("toggle.deactivated")
          : t("toggle.activated"),
      )
    })
  }

  function onDelete(brand: AdminBrandRow) {
    if (!window.confirm(t("deleteConfirm", { name: brand.name }))) return
    setPendingId(brand.id)
    startTransition(async () => {
      const res = await deleteBrand(brand.id)
      setPendingId(null)
      if (!res.ok) {
        toast.error(
          res.error === "brand_in_use" ? t("toast.inUse") : t("toast.error"),
        )
        return
      }
      toast.success(t("toast.deleted"))
    })
  }

  const activeCount = brands.filter((b) => b.is_active).length
  const inactiveCount = brands.length - activeCount

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

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 h-11 px-3 rounded-xl border border-border bg-card text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="size-4 accent-moroccan-red-500"
            />
            {t("status.inactive")}
          </label>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
          >
            <Upload className="size-4" aria-hidden="true" />
            {t("uploadJson")}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setCreateOpen(true)
            }}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("addManual")}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("count", { count: brands.length })}
        {" · "}
        <span className="text-moroccan-mint-500">{activeCount} {t("status.active")}</span>
        {inactiveCount > 0 && (
          <>
            {" · "}
            <span className="text-muted-foreground">
              {inactiveCount} {t("status.inactive")}
            </span>
          </>
        )}
      </p>

      {/* Table */}
      {brands.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={Car}
            title={t("empty")}
            description={t("emptyDesc")}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-8 shadow-card text-center text-sm text-muted-foreground">
          —
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3 w-16">{t("columns.logo")}</th>
                  <th className="text-start px-4 py-3">{t("columns.name")}</th>
                  <th className="text-start px-4 py-3">{t("columns.slug")}</th>
                  <th className="text-start px-4 py-3 w-20">{t("columns.order")}</th>
                  <th className="text-start px-4 py-3">{t("columns.active")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((brand) => (
                  <tr
                    key={brand.id}
                    className={cn(
                      "border-t border-border hover:bg-moroccan-sand-50/40",
                      !brand.is_active && "opacity-60",
                    )}
                  >
                    <td className="px-4 py-2">
                      {brand.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="h-10 w-10 object-contain rounded-lg bg-moroccan-sand-50 p-1 border border-border"
                          loading="eager"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-moroccan-sand-50/60 border border-border flex items-center justify-center text-xs text-muted-foreground">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {brand.name}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {brand.slug}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                      {brand.order_index}
                    </td>
                    <td className="px-4 py-3">
                      {brand.is_active ? (
                        <Badge variant="verified" className="text-[10px]">
                          {t("status.active")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          {t("status.inactive")}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onToggle(brand)}
                          disabled={pendingId === brand.id}
                          className={cn(
                            "inline-flex items-center justify-center size-9 rounded-lg hover:bg-moroccan-sand-50 disabled:opacity-50",
                            brand.is_active
                              ? "text-moroccan-mint-500"
                              : "text-muted-foreground",
                          )}
                          aria-label={
                            brand.is_active
                              ? t("toggle.deactivate")
                              : t("toggle.activate")
                          }
                          title={
                            brand.is_active
                              ? t("toggle.deactivate")
                              : t("toggle.activate")
                          }
                        >
                          <Power className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(brand)
                            setCreateOpen(true)
                          }}
                          className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700"
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(brand)}
                          disabled={pendingId === brand.id}
                          className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-red-50 hover:text-moroccan-red-600 disabled:opacity-50"
                          aria-label="Delete"
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

      <BrandFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={editing}
      />
      <BrandImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}

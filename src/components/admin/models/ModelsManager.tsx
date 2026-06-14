"use client"

import { useMemo, useState, useTransition } from "react"
import { Layers, Pencil, Plus, Power, Search, Trash2, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  deleteModel,
  toggleModelActive,
} from "@/app/[locale]/admin/models/actions"
import { ModelFormDialog } from "@/components/admin/models/ModelFormDialog"
import { ModelImportDialog } from "@/components/admin/models/ModelImportDialog"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/EmptyState"
import type { AdminBrandRow, AdminModelRow } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"

type Props = {
  models: AdminModelRow[]
  brands: AdminBrandRow[]
}

export function ModelsManager({ models, brands }: Props) {
  const t = useTranslations("adminPanel.modelsPage")
  const [q, setQ] = useState("")
  const [brandFilter, setBrandFilter] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<AdminModelRow | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    let rows = models
    if (brandFilter) rows = rows.filter((m) => m.brand_id === brandFilter)
    if (!showInactive) rows = rows.filter((m) => m.is_active)
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      rows = rows.filter(
        (m) =>
          m.name.toLowerCase().includes(needle) ||
          m.slug.toLowerCase().includes(needle) ||
          (m.brand?.name.toLowerCase().includes(needle) ?? false),
      )
    }
    return rows
  }, [models, q, brandFilter, showInactive])

  function onToggle(model: AdminModelRow) {
    setPendingId(model.id)
    startTransition(async () => {
      const res = await toggleModelActive({
        id: model.id,
        is_active: !model.is_active,
      })
      setPendingId(null)
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(
        model.is_active
          ? t("toggle.deactivated")
          : t("toggle.activated"),
      )
    })
  }

  function onDelete(model: AdminModelRow) {
    if (!window.confirm(t("deleteConfirm", { name: model.name }))) return
    setPendingId(model.id)
    startTransition(async () => {
      const res = await deleteModel(model.id)
      setPendingId(null)
      if (!res.ok) {
        toast.error(
          res.error === "model_in_use" ? t("toast.inUse") : t("toast.error"),
        )
        return
      }
      toast.success(t("toast.deleted"))
    })
  }

  if (brands.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
        <EmptyState
          icon={Layers}
          title={t("empty")}
          description={t("emptyNoBrands")}
        />
      </div>
    )
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

      {/* Brand filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <BrandChip
          active={brandFilter === null}
          onClick={() => setBrandFilter(null)}
        >
          {t("filterAllBrands")}
          <span className="ms-1.5 text-[10px] opacity-70">
            ({models.length})
          </span>
        </BrandChip>
        {brands.map((brand) => {
          const count = models.filter((m) => m.brand_id === brand.id).length
          return (
            <BrandChip
              key={brand.id}
              active={brandFilter === brand.id}
              onClick={() => setBrandFilter(brand.id)}
            >
              {brand.name}
              <span className="ms-1.5 text-[10px] opacity-70">({count})</span>
            </BrandChip>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {t("count", { count: filtered.length })}
      </p>

      {/* Table */}
      {models.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={Layers}
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
                  <th className="text-start px-4 py-3">{t("columns.brand")}</th>
                  <th className="text-start px-4 py-3">{t("columns.name")}</th>
                  <th className="text-start px-4 py-3">{t("columns.slug")}</th>
                  <th className="text-start px-4 py-3">{t("columns.active")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((model) => (
                  <tr
                    key={model.id}
                    className={cn(
                      "border-t border-border hover:bg-moroccan-sand-50/40",
                      !model.is_active && "opacity-60",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {model.brand?.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={model.brand.logo_url}
                            alt={model.brand.name}
                            className="h-7 w-7 object-contain rounded bg-moroccan-sand-50 p-0.5 border border-border"
                            loading="lazy"
                          />
                        ) : null}
                        <span className="text-sm text-foreground">
                          {model.brand?.name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {model.name}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {model.slug}
                    </td>
                    <td className="px-4 py-3">
                      {model.is_active ? (
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
                          onClick={() => onToggle(model)}
                          disabled={pendingId === model.id}
                          className={cn(
                            "inline-flex items-center justify-center size-9 rounded-lg hover:bg-moroccan-sand-50 disabled:opacity-50",
                            model.is_active
                              ? "text-moroccan-mint-500"
                              : "text-muted-foreground",
                          )}
                          aria-label={
                            model.is_active
                              ? t("toggle.deactivate")
                              : t("toggle.activate")
                          }
                          title={
                            model.is_active
                              ? t("toggle.deactivate")
                              : t("toggle.activate")
                          }
                        >
                          <Power className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(model)
                            setCreateOpen(true)
                          }}
                          className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700"
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(model)}
                          disabled={pendingId === model.id}
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

      <ModelFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        brands={brands}
        initial={editing}
        defaultBrandId={brandFilter}
      />
      <ModelImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}

function BrandChip({
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
        "shrink-0 inline-flex items-center rounded-full px-3.5 h-8 text-xs font-medium transition-colors",
        active
          ? "bg-moroccan-red-500 text-white"
          : "bg-card border border-border text-foreground hover:bg-moroccan-sand-50",
      )}
    >
      {children}
    </button>
  )
}

"use client"

import { useMemo, useState, useTransition } from "react"
import { MapPin, Pencil, Plus, Search, Trash2, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { deleteCity } from "@/app/[locale]/admin/cities/actions"
import { CityFormDialog } from "@/components/admin/cities/CityFormDialog"
import { CityImportDialog } from "@/components/admin/cities/CityImportDialog"
import { EmptyState } from "@/components/ui/EmptyState"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import type { AdminCityRow } from "@/lib/queries/admin"

type Props = {
  cities: AdminCityRow[]
}

export function CitiesManager({ cities }: Props) {
  const t = useTranslations("adminPanel.citiesPage")
  const [q, setQ] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCityRow | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    if (!q.trim()) return cities
    const needle = q.trim().toLowerCase()
    return cities.filter(
      (c) =>
        c.name_ar.toLowerCase().includes(needle) ||
        c.name_fr.toLowerCase().includes(needle) ||
        c.slug.toLowerCase().includes(needle),
    )
  }, [cities, q])

  function onDelete(city: AdminCityRow) {
    if (!window.confirm(t("deleteConfirm", { name: city.name_fr }))) return
    setPendingId(city.id)
    startTransition(async () => {
      const res = await deleteCity(city.id)
      setPendingId(null)
      if (!res.ok) {
        const msg =
          res.error === "city_in_use"
            ? "City is in use (annonces or users)"
            : t("toast.error")
        toast.error(msg)
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
          >
            <Upload className="size-4" aria-hidden="true" />
            {t("uploadJson")}
          </button>
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
      </div>

      <p className="text-xs text-muted-foreground">
        {t("count", { count: cities.length })}
      </p>

      {/* Table */}
      {cities.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={MapPin}
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
                  <th className="text-start px-4 py-3">{t("columns.nameAr")}</th>
                  <th className="text-start px-4 py-3">{t("columns.nameFr")}</th>
                  <th className="text-start px-4 py-3">{t("columns.slug")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((city) => (
                  <tr
                    key={city.id}
                    className="border-t border-border hover:bg-moroccan-sand-50/40"
                  >
                    <td className="px-4 py-3 text-sm text-foreground" dir="rtl">
                      {city.name_ar}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {city.name_fr}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {city.slug}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(city)
                            setCreateOpen(true)
                          }}
                          className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700"
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(city)}
                          disabled={pendingId === city.id}
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

      <CityFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={editing}
      />
      <CityImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}

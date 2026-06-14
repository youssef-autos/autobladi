"use client"

import { useState, useTransition } from "react"
import { Check, Eye, EyeOff, Pencil, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  setPlacementVisibility,
  updatePlacement,
} from "@/app/[locale]/admin/ads/actions"
import { Badge } from "@/components/ui/badge"
import type { AdminPlacementRow } from "@/lib/queries/admin"

type Props = {
  placements: AdminPlacementRow[]
}

/**
 * Inline-editing table for ad placement sizes + descriptions. Each row
 * shows the slug and current size, and clicking the edit pencil turns
 * the size cells into inputs — no dialog needed for such simple changes.
 */
export function PlacementsManager({ placements }: Props) {
  const t = useTranslations("adminPanel.placementsPage")

  return (
    <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-start px-4 py-3">{t("columns.slug")}</th>
              <th className="text-start px-4 py-3">{t("columns.name")}</th>
              <th className="text-start px-4 py-3 w-40">{t("columns.size")}</th>
              <th className="text-start px-4 py-3">{t("columns.description")}</th>
              <th className="text-start px-4 py-3 w-20">{t("columns.adsCount")}</th>
              <th className="text-end px-4 py-3 w-20">{t("columns.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {placements.map((p) => (
              <PlacementRow key={p.id} placement={p} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlacementRow({ placement }: { placement: AdminPlacementRow }) {
  const t = useTranslations("adminPanel.placementsPage")
  const tForm = useTranslations("adminPanel.placementsPage.form")
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(placement.name)
  const [width, setWidth] = useState(String(placement.width ?? ""))
  const [height, setHeight] = useState(String(placement.height ?? ""))
  const [description, setDescription] = useState(placement.description ?? "")
  const [isActive, setIsActive] = useState(placement.is_active)
  const [pending, startTransition] = useTransition()
  const [togglingVis, startVisTransition] = useTransition()

  function onToggleVisibility() {
    const next = !isActive
    startVisTransition(async () => {
      const res = await setPlacementVisibility({ id: placement.id, is_active: next })
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      setIsActive(next)
      toast.success(next ? t("toast.shown") : t("toast.hidden"))
    })
  }

  function onSave() {
    startTransition(async () => {
      const res = await updatePlacement({
        id: placement.id,
        name: name.trim() || placement.name,
        width: width ? Number(width) : null,
        height: height ? Number(height) : null,
        description: description.trim() || null,
      })
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.updated"))
      setEditing(false)
    })
  }

  function onCancel() {
    setName(placement.name)
    setWidth(String(placement.width ?? ""))
    setHeight(String(placement.height ?? ""))
    setDescription(placement.description ?? "")
    setEditing(false)
  }

  const cellBase = "px-4 py-3 align-middle"

  return (
    <tr
      className={cn(
        "border-t border-border hover:bg-moroccan-sand-50/30 transition-colors",
        !isActive && "bg-muted/30",
      )}
    >
      <td className={cellBase}>
        <code className="text-xs bg-moroccan-sand-50 rounded-md px-1.5 py-0.5 text-moroccan-red-700">
          {placement.slug}
        </code>
      </td>
      <td className={cellBase}>
        <div className="flex items-center gap-2">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inlineCls}
            />
          ) : (
            <span
              className={cn(
                "text-sm",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {placement.name}
            </span>
          )}
          {!isActive && !editing && (
            <Badge
              variant="outline"
              className="text-[10px] gap-1 text-muted-foreground border-muted-foreground/30"
            >
              <EyeOff className="size-3" aria-hidden="true" />
              {t("hiddenBadge")}
            </Badge>
          )}
        </div>
      </td>
      <td className={cellBase}>
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder={tForm("width")}
              min={1}
              max={9999}
              className={cn(inlineCls, "w-20 text-center")}
            />
            <span className="text-muted-foreground text-xs">×</span>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder={tForm("height")}
              min={1}
              max={9999}
              className={cn(inlineCls, "w-20 text-center")}
            />
            <span className="text-[11px] text-muted-foreground">px</span>
          </div>
        ) : placement.width && placement.height ? (
          <div className="flex items-center gap-2">
            <SizeSwatch width={placement.width} height={placement.height} />
            <span className="text-sm font-mono text-foreground">
              {t("sizePreview", {
                width: placement.width,
                height: placement.height,
              })}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className={cellBase}>
        {editing ? (
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={tForm("descriptionPlaceholder")}
            maxLength={300}
            className={cn(inlineCls, "w-full")}
          />
        ) : (
          <span className="text-xs text-muted-foreground line-clamp-2">
            {placement.description ?? "—"}
          </span>
        )}
      </td>
      <td className={cellBase}>
        {placement.ads_count > 0 ? (
          <Badge variant="pro" className="text-[10px]">
            {placement.ads_count}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">{t("noAds")}</span>
        )}
      </td>
      <td className={cellBase}>
        <div className="flex items-center justify-end gap-1">
          {editing ? (
            <>
              <button
                type="button"
                onClick={onSave}
                disabled={pending}
                className="inline-flex items-center justify-center size-9 rounded-lg text-moroccan-mint-500 hover:bg-moroccan-mint-500/10 disabled:opacity-50"
                aria-label="Save"
              >
                <Check className="size-4" />
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={pending}
                className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50"
                aria-label="Cancel"
              >
                <X className="size-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleVisibility}
                disabled={togglingVis}
                title={isActive ? t("hide") : t("show")}
                aria-label={isActive ? t("hide") : t("show")}
                className={cn(
                  "inline-flex items-center justify-center size-9 rounded-lg hover:bg-moroccan-sand-50 disabled:opacity-50",
                  isActive
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-moroccan-mint-500 hover:text-moroccan-mint-500",
                )}
              >
                {isActive ? (
                  <Eye className="size-4" />
                ) : (
                  <EyeOff className="size-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700"
                aria-label="Edit"
              >
                <Pencil className="size-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

/** Tiny visual showing the placement's proportions (max 40px in either axis). */
function SizeSwatch({ width, height }: { width: number; height: number }) {
  const MAX = 40
  const scale = MAX / Math.max(width, height)
  const w = Math.max(6, Math.round(width * scale))
  const h = Math.max(6, Math.round(height * scale))
  return (
    <span
      aria-hidden="true"
      title={`${width} × ${height}`}
      style={{ width: w, height: h }}
      className="inline-block shrink-0 rounded-sm border border-moroccan-gold-500/50 bg-moroccan-gold-500/15"
    />
  )
}

const inlineCls =
  "h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

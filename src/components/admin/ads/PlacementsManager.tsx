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
  const [isActive, setIsActive] = useState(placement.is_active)
  const [pending, startTransition] = useTransition()
  const [togglingVis, startVisTransition] = useTransition()

  // Committed state — shown in display mode, updated after a successful save
  const [savedName, setSavedName] = useState(placement.name)
  const [savedWidth, setSavedWidth] = useState<number | null>(placement.width ?? null)
  const [savedHeight, setSavedHeight] = useState<number | null>(placement.height ?? null)
  const [savedDesc, setSavedDesc] = useState(placement.description ?? "")

  // Draft state — used only while the row is in edit mode
  const [draftName, setDraftName] = useState(placement.name)
  const [draftWidth, setDraftWidth] = useState(String(placement.width ?? ""))
  const [draftHeight, setDraftHeight] = useState(String(placement.height ?? ""))
  const [draftDesc, setDraftDesc] = useState(placement.description ?? "")

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
    const newName = draftName.trim() || savedName
    const newWidth = draftWidth ? Number(draftWidth) : null
    const newHeight = draftHeight ? Number(draftHeight) : null
    const newDesc = draftDesc.trim() || null

    startTransition(async () => {
      const res = await updatePlacement({
        id: placement.id,
        name: newName,
        width: newWidth,
        height: newHeight,
        description: newDesc,
      })
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      // Commit the new values so the display row reflects them immediately
      setSavedName(newName)
      setSavedWidth(newWidth)
      setSavedHeight(newHeight)
      setSavedDesc(newDesc ?? "")
      toast.success(t("toast.updated"))
      setEditing(false)
    })
  }

  function onEdit() {
    // Initialise draft from the last committed values
    setDraftName(savedName)
    setDraftWidth(String(savedWidth ?? ""))
    setDraftHeight(String(savedHeight ?? ""))
    setDraftDesc(savedDesc)
    setEditing(true)
  }

  function onCancel() {
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
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className={inlineCls}
            />
          ) : (
            <span
              className={cn(
                "text-sm",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {savedName}
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
              value={draftWidth}
              onChange={(e) => setDraftWidth(e.target.value)}
              placeholder={tForm("width")}
              min={1}
              max={9999}
              className={cn(inlineCls, "w-20 text-center")}
            />
            <span className="text-muted-foreground text-xs">×</span>
            <input
              type="number"
              value={draftHeight}
              onChange={(e) => setDraftHeight(e.target.value)}
              placeholder={tForm("height")}
              min={1}
              max={9999}
              className={cn(inlineCls, "w-20 text-center")}
            />
            <span className="text-[11px] text-muted-foreground">px</span>
          </div>
        ) : savedWidth && savedHeight ? (
          <div className="flex items-center gap-2">
            <SizeSwatch width={savedWidth} height={savedHeight} />
            <span className="text-sm font-mono text-foreground">
              {t("sizePreview", { width: savedWidth, height: savedHeight })}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className={cellBase}>
        {editing ? (
          <input
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            placeholder={tForm("descriptionPlaceholder")}
            maxLength={300}
            className={cn(inlineCls, "w-full")}
          />
        ) : (
          <span className="text-xs text-muted-foreground line-clamp-2">
            {savedDesc || "—"}
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
                onClick={onEdit}
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

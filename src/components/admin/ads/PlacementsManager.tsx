"use client"

import { useState, useTransition } from "react"
import { Eye, EyeOff, Monitor, Smartphone, LayoutGrid } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { setPlacementVisibility } from "@/app/[locale]/admin/ads/actions"
import { Badge } from "@/components/ui/badge"
import type { AdminPlacementRow } from "@/lib/queries/admin"

type Props = {
  placements: AdminPlacementRow[]
}

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
              <th className="text-start px-4 py-3 w-36">{t("columns.size")}</th>
              <th className="text-start px-4 py-3 w-28">{t("columns.device")}</th>
              <th className="text-start px-4 py-3">{t("columns.description")}</th>
              <th className="text-start px-4 py-3 w-20">{t("columns.adsCount")}</th>
              <th className="text-end px-4 py-3 w-16">{t("columns.actions")}</th>
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
  const [isActive, setIsActive] = useState(placement.is_active)
  const [togglingVis, startVisTransition] = useTransition()

  const device = (placement as AdminPlacementRow & { device?: string }).device ?? "both"

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
          <span
            className={cn(
              "text-sm",
              isActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {placement.name}
          </span>
          {!isActive && (
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
        {placement.width && placement.height ? (
          <div className="flex items-center gap-2">
            <SizeSwatch width={placement.width} height={placement.height} />
            <span className="text-sm font-mono text-foreground">
              {t("sizePreview", { width: placement.width, height: placement.height })}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className={cellBase}>
        <DeviceBadge device={device} t={t} />
      </td>
      <td className={cellBase}>
        <span className="text-xs text-muted-foreground line-clamp-2">
          {placement.description || "—"}
        </span>
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
        <div className="flex items-center justify-end">
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
        </div>
      </td>
    </tr>
  )
}

function DeviceBadge({
  device,
  t,
}: {
  device: string
  t: ReturnType<typeof useTranslations<"adminPanel.placementsPage">>
}) {
  if (device === "mobile") {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] border-blue-400/50 text-blue-600">
        <Smartphone className="size-3" />
        {t("device.mobile")}
      </Badge>
    )
  }
  if (device === "desktop") {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] border-moroccan-gold-500/50 text-moroccan-gold-700">
        <Monitor className="size-3" />
        {t("device.desktop")}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
      <LayoutGrid className="size-3" />
      {t("device.both")}
    </Badge>
  )
}

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

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

"use client"

import { useState } from "react"
import { ExternalLink, Link2, LocateFixed, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

type Props = {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number | null, lng: number | null) => void
}

/** Pull lat/lng out of a Google Maps URL (or bare "lat,lng" text). */
function parseLatLng(input: string): { lat: number; lng: number } | null {
  const s = input.trim()
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // .../@lat,lng,zoom
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // place links
    /[?&](?:q|query|ll|center|destination|daddr)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/, // bare "lat, lng"
  ]
  for (const re of patterns) {
    const m = s.match(re)
    if (m) {
      const lat = Number(m[1])
      const lng = Number(m[2])
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      ) {
        return { lat, lng }
      }
    }
  }
  return null
}

const round6 = (n: number) => Number(n.toFixed(6))

/**
 * Easy location picker: one-tap "use my current location" (browser GPS) or
 * paste a Google Maps link / coordinates — both auto-fill the fields. The two
 * number inputs stay available for manual/advanced entry.
 */
export function MapPicker({ latitude, longitude, onChange }: Props) {
  const t = useTranslations("showroom.info")
  const [pasteValue, setPasteValue] = useState("")
  const [locating, setLocating] = useState(false)

  const hasCoords = latitude != null && longitude != null
  const previewSrc = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : null
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : "https://www.google.com/maps"

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(t("geoUnsupported"))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(round6(pos.coords.latitude), round6(pos.coords.longitude))
        setLocating(false)
        toast.success(t("geoSuccess"))
      },
      () => {
        setLocating(false)
        toast.error(t("geoError"))
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function applyPaste(value: string) {
    setPasteValue(value)
    const parsed = parseLatLng(value)
    if (parsed) {
      onChange(round6(parsed.lat), round6(parsed.lng))
      toast.success(t("pasteSuccess"))
    }
  }

  return (
    <div className="space-y-4">
      {/* Easiest: current location + paste a link */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 h-11 w-full sm:w-auto px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 disabled:opacity-60 transition-all"
        >
          <LocateFixed className="size-4" aria-hidden="true" />
          {locating ? t("locating") : t("useMyLocation")}
        </button>

        <div className="space-y-1.5">
          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link2 className="size-3.5" aria-hidden="true" />
            {t("pasteLabel")}
          </label>
          <input
            type="text"
            value={pasteValue}
            onChange={(e) => applyPaste(e.target.value)}
            placeholder="https://maps.google.com/…  ·  33.5731, -7.5898"
            dir="ltr"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:border-moroccan-red-500/40"
          />
          <p className="text-[11px] text-muted-foreground">{t("pasteHelp")}</p>
        </div>
      </div>

      {/* Advanced: manual coordinates */}
      <details className="group">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground select-none">
          {t("manualCoords")}
        </summary>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs text-muted-foreground">{t("lat")}</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.000001"
              value={latitude ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value)
                onChange(v, longitude)
              }}
              dir="ltr"
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:border-moroccan-red-500/40"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs text-muted-foreground">{t("lng")}</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.000001"
              value={longitude ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value)
                onChange(latitude, v)
              }}
              dir="ltr"
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:border-moroccan-red-500/40"
            />
          </label>
        </div>
      </details>

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-moroccan-red-500 hover:underline"
      >
        <ExternalLink className="size-3.5" aria-hidden="true" />
        {t("pickFromMaps")}
      </a>

      <div className="relative aspect-[16/9] rounded-2xl bg-moroccan-sand-50 overflow-hidden border border-border">
        {previewSrc ? (
          <iframe
            src={previewSrc}
            title="Map preview"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            <MapPin className="inline size-4 me-1" aria-hidden="true" />
            —
          </p>
        )}
      </div>
    </div>
  )
}

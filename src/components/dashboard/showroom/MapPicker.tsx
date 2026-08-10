"use client"

import { useState } from "react"
import { Code2, ExternalLink, LocateFixed, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

type Props = {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number | null, lng: number | null) => void
}

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  )
}

/**
 * Pull lat/lng out of a pasted Google Maps "Embed a map" <iframe> snippet (or,
 * leniently, a plain share link / bare "lat,lng" text).
 */
function parseLatLng(input: string): { lat: number; lng: number } | null {
  const embedMatch = input.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)
  const s = (embedMatch ? embedMatch[1] : input).trim()

  // The embed URL's "pb=" parameter encodes position as !2d{lng}!3d{lat} —
  // longitude first, unlike every other pattern below.
  const embedCoords = s.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/)
  if (embedCoords) {
    const lng = Number(embedCoords[1])
    const lat = Number(embedCoords[2])
    if (isValidCoord(lat, lng)) return { lat, lng }
  }

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
      if (isValidCoord(lat, lng)) return { lat, lng }
    }
  }
  return null
}

const round6 = (n: number) => Number(n.toFixed(6))

/**
 * Easy location picker: one-tap "use my current location" (browser GPS) or
 * paste Google Maps' "Embed a map" HTML snippet — both auto-fill the
 * lat/lng the rest of the app already stores and renders from.
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
      {/* Easiest: current location + paste an embed snippet */}
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
            <Code2 className="size-3.5" aria-hidden="true" />
            {t("pasteLabel")}
          </label>
          <textarea
            value={pasteValue}
            onChange={(e) => applyPaste(e.target.value)}
            placeholder='<iframe src="https://www.google.com/maps/embed?pb=…" …></iframe>'
            dir="ltr"
            rows={3}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-mono resize-y focus:outline-none focus:border-moroccan-red-500/40"
          />
          <p className="text-[11px] text-muted-foreground">{t("pasteHelp")}</p>
        </div>
      </div>

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

"use client"

import { useRef, useState } from "react"
import { ClipboardPaste, ExternalLink, LocateFixed, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { resolveMapsShortLink } from "@/app/[locale]/dashboard/showroom/actions"

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

function isMapsShortLink(input: string): boolean {
  try {
    const u = new URL(input)
    return u.protocol === "https:" && u.hostname === "maps.app.goo.gl"
  } catch {
    return false
  }
}

/**
 * Pull lat/lng out of a pasted Google Maps link, "Embed a map" <iframe>
 * snippet, or bare "lat,lng" text. Short share links (maps.app.goo.gl) carry
 * no coordinates and must be resolved server-side first — see applyPaste.
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
    // Place pin (from the "data=" blob) first: on place links the "@lat,lng"
    // further down is only the map's *viewport* center, which Google often
    // offsets from the actual pin by hundreds of meters (e.g. to leave room
    // for the details panel) — !3d/!4d is the precise, geocoded location.
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // .../@lat,lng,zoom — viewport fallback
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
 * paste a Google Maps link (including short maps.app.goo.gl links) or its
 * "Embed a map" HTML snippet — all auto-fill the lat/lng the rest of the
 * app already stores and renders from.
 */
export function MapPicker({ latitude, longitude, onChange }: Props) {
  const t = useTranslations("showroom.info")
  const [pasteValue, setPasteValue] = useState("")
  const [locating, setLocating] = useState(false)
  const [resolving, setResolving] = useState(false)
  const pasteRequestId = useRef(0)

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

  async function applyPaste(value: string) {
    setPasteValue(value)
    const trimmed = value.trim()
    if (!trimmed) return

    const parsed = parseLatLng(trimmed)
    if (parsed) {
      onChange(round6(parsed.lat), round6(parsed.lng))
      toast.success(t("pasteSuccess"))
      return
    }

    if (!isMapsShortLink(trimmed)) {
      toast.error(t("pasteError"))
      return
    }

    const requestId = ++pasteRequestId.current
    setResolving(true)
    const result = await resolveMapsShortLink(trimmed)
    if (pasteRequestId.current !== requestId) return // a newer paste superseded this one
    setResolving(false)

    const resolved = result.ok ? parseLatLng(result.url) : null
    if (resolved) {
      onChange(round6(resolved.lat), round6(resolved.lng))
      toast.success(t("pasteSuccess"))
    } else {
      toast.error(t("pasteError"))
    }
  }

  return (
    <div className="space-y-4">
      {/* Easiest: current location + paste a link or embed snippet */}
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
            <ClipboardPaste className="size-3.5" aria-hidden="true" />
            {t("pasteLabel")}
          </label>
          <textarea
            value={pasteValue}
            onChange={(e) => applyPaste(e.target.value)}
            placeholder="https://maps.app.goo.gl/…"
            dir="ltr"
            rows={2}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-mono resize-y focus:outline-none focus:border-moroccan-red-500/40"
          />
          <p className="text-[11px] text-muted-foreground">
            {resolving ? t("pasteResolving") : t("pasteHelp")}
          </p>
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

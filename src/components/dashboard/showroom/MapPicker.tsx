"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ExternalLink, Loader2, LocateFixed, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import type * as Leaflet from "leaflet"

import "leaflet/dist/leaflet.css"

import { searchAddress, type AddressResult } from "@/app/[locale]/dashboard/showroom/actions"

type Props = {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number | null, lng: number | null) => void
}

const round6 = (n: number) => Number(n.toFixed(6))

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  )
}

// Accepts exactly the "latitude, longitude" format this component itself
// displays — not an arbitrary Google Maps URL/HTML blob. That's the whole
// point: unlike parsing a pasted link (unreliable — Google's share links
// don't consistently encode coordinates the same way), this format is one
// we define and control, so it can never be ambiguous or wrong.
function parsePosition(input: string): { lat: number; lng: number } | null {
  const m = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)
  if (!m) return null
  const lat = Number(m[1])
  const lng = Number(m[2])
  return isValidCoord(lat, lng) ? { lat, lng } : null
}

// Wide view of Morocco — shown until the seller has (or picks) an exact spot.
const MOROCCO_CENTER: [number, number] = [31.5, -6.5]
const MOROCCO_ZOOM = 6
const PIN_ZOOM = 15

// A plain rotated square (3 round corners + 1 square corner) reads as a map
// pin without needing Leaflet's default marker images, which break under
// bundlers unless their asset paths are patched.
const PIN_ICON_HTML =
  '<span style="display:block;width:26px;height:26px;background:#c1272d;border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>'

/**
 * Location picker built on an interactive map (Leaflet + OpenStreetMap, no
 * API key required): search an address, use GPS, or click/drag the pin
 * directly — the lat/lng always comes straight from the pin's real position,
 * never from parsing a pasted link, which proved unreliable (Google's share
 * links don't consistently encode coordinates in a parseable way).
 */
export function MapPicker({ latitude, longitude, onChange }: Props) {
  const t = useTranslations("showroom.info")
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const markerRef = useRef<Leaflet.Marker | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const [locating, setLocating] = useState(false)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<AddressResult[] | null>(null)
  const [positionInput, setPositionInput] = useState(
    latitude != null && longitude != null ? `${latitude}, ${longitude}` : "",
  )
  // Keep the editable position field in sync with the map/search/GPS —
  // adjusted during render (React's recommended pattern for this, see
  // https://react.dev/learn/you-might-not-need-an-effect) rather than in an
  // effect, so typing in the field itself isn't fighting an extra render.
  const [syncedLat, setSyncedLat] = useState(latitude)
  const [syncedLng, setSyncedLng] = useState(longitude)
  if (syncedLat !== latitude || syncedLng !== longitude) {
    setSyncedLat(latitude)
    setSyncedLng(longitude)
    setPositionInput(latitude != null && longitude != null ? `${latitude}, ${longitude}` : "")
  }

  function placeMarker(lat: number, lng: number, { fromUser }: { fromUser: boolean }) {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map) return

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      const marker = L.marker([lat, lng], {
        draggable: true,
        icon: L.divIcon({
          className: "",
          html: PIN_ICON_HTML,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
        }),
      }).addTo(map)
      marker.on("dragend", () => {
        const pos = marker.getLatLng()
        onChangeRef.current(round6(pos.lat), round6(pos.lng))
      })
      markerRef.current = marker
    }

    if (fromUser) onChangeRef.current(round6(lat), round6(lng))
  }

  // Create the map once on mount.
  useEffect(() => {
    let cancelled = false
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return
      leafletRef.current = L

      const hasCoords = latitude != null && longitude != null
      const map = L.map(containerRef.current, {
        center: hasCoords ? [latitude, longitude] : MOROCCO_CENTER,
        zoom: hasCoords ? PIN_ZOOM : MOROCCO_ZOOM,
      })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      map.on("click", (e) => placeMarker(e.latlng.lat, e.latlng.lng, { fromUser: true }))

      mapRef.current = map
      if (hasCoords) placeMarker(latitude, longitude, { fromUser: false })
      requestAnimationFrame(() => map.invalidateSize())

      // The card/grid layout around this map can resize after mount (e.g.
      // the secteur field appearing, or a viewport change) — without this,
      // Leaflet keeps rendering at its stale size and the newly-revealed
      // area shows as blank tiles.
      const resizeObserver = new ResizeObserver(() => map.invalidateSize())
      if (containerRef.current) resizeObserver.observe(containerRef.current)
      resizeObserverRef.current = resizeObserver
    })

    return () => {
      cancelled = true
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // Intentionally runs once: it seeds the map from whatever latitude/
    // longitude are set at mount. Later changes are handled by the effect
    // below instead of recreating the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Follow changes that originate outside the map itself (GPS button, a
  // search result). Clicking/dragging the map already moves its own marker
  // directly, so this only needs to catch the other sources.
  useEffect(() => {
    const map = mapRef.current
    if (!map || latitude == null || longitude == null) return
    const current = markerRef.current?.getLatLng()
    if (current && round6(current.lat) === latitude && round6(current.lng) === longitude) return
    placeMarker(latitude, longitude, { fromUser: false })
    map.setView([latitude, longitude], Math.max(map.getZoom(), PIN_ZOOM))
  }, [latitude, longitude])

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
      (err) => {
        setLocating(false)
        toast.error(err.code === err.PERMISSION_DENIED ? t("geoDenied") : t("geoError"))
      },
      // Not enableHighAccuracy: on desktop browsers (no GPS chip) that hint
      // makes the OS hold out for a GPS-grade fix that never comes, which is
      // exactly what was surfacing as "impossible d'obtenir la position" —
      // network-based positioning is faster and reliable, and the pin can
      // still be dragged afterward for precision.
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

  async function handleSearch() {
    const q = query.trim()
    if (q.length < 3 || searching) return
    setSearching(true)
    setResults(null)
    try {
      const found = await searchAddress(q)
      setResults(found)
      if (found.length === 0) toast.error(t("searchNoResults"))
    } catch {
      toast.error(t("searchError"))
    } finally {
      setSearching(false)
    }
  }

  function pickResult(result: AddressResult) {
    onChange(round6(result.lat), round6(result.lng))
    setResults(null)
  }

  function applyPositionInput() {
    const parsed = parsePosition(positionInput)
    if (!parsed) {
      toast.error(t("positionInvalid"))
      return
    }
    onChange(round6(parsed.lat), round6(parsed.lng))
    toast.success(t("positionApplied"))
  }

  const hasCoords = latitude != null && longitude != null
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("mapInstructions")}</p>

      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* A plain div, not <form> — MapPicker renders inside the showroom
            page's own <form>, and HTML forbids nesting <form> elements. */}
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setResults(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSearch()
              }
            }}
            placeholder={t("searchPlaceholder")}
            className="h-11 flex-1 min-w-0 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:border-moroccan-red-500/40"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || query.trim().length < 3}
            className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-input bg-background text-sm font-medium hover:bg-moroccan-sand-50 disabled:opacity-50 transition-colors shrink-0"
          >
            {searching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="size-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{t("searchButton")}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 disabled:opacity-60 transition-all shrink-0"
        >
          <LocateFixed className="size-4" aria-hidden="true" />
          {locating ? t("locating") : t("useMyLocation")}
        </button>
      </div>

      {results && results.length > 0 && (
        <ul className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pickResult(r)}
                className="w-full text-start px-3 py-2.5 text-sm hover:bg-moroccan-sand-50 transition-colors"
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-border">
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">{t("positionLabel")}</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={positionInput}
            onChange={(e) => setPositionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                applyPositionInput()
              }
            }}
            placeholder="33.235066, -8.520584"
            dir="ltr"
            className="h-10 flex-1 min-w-0 rounded-xl border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:border-moroccan-red-500/40"
          />
          <button
            type="button"
            onClick={applyPositionInput}
            aria-label={t("positionApplyLabel")}
            className="inline-flex items-center justify-center size-10 rounded-xl border border-input bg-background hover:bg-moroccan-sand-50 transition-colors shrink-0"
          >
            <Check className="size-4" aria-hidden="true" />
          </button>
        </div>
        {hasCoords && googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-moroccan-red-500 hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            {t("verifyOnMaps")}
          </a>
        )}
      </div>
    </div>
  )
}

import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "autobladi.ma — Le marché auto au Maroc"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Default Open Graph card — used anywhere we don't override per-route.
 * Moroccan red→gold gradient with the wordmark centered.
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #c1272d 0%, #8c1a20 50%, #1a1a1a 100%)",
          color: "white",
          fontFamily: "sans-serif",
          padding: 80,
          position: "relative",
        }}
      >
        {/* Gold accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: "#e5c547",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            fontSize: 110,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          autobladi
          <span style={{ color: "#e5c547" }}>.ma</span>
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: 36,
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
          }}
        >
          Le marché auto #1 au Maroc — سوق السيارات الأول في المغرب
        </div>

        <div
          style={{
            marginTop: 48,
            display: "flex",
            gap: 60,
            fontSize: 22,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <span>10K+ voitures</span>
          <span>•</span>
          <span>300+ showrooms</span>
          <span>•</span>
          <span>40+ villes</span>
        </div>
      </div>
    ),
    size,
  )
}

import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 64, height: 64 }
export const contentType = "image/png"

/**
 * Favicon — Moroccan red square with a stylized "a" wordmark in gold.
 * Crisp at small sizes since we use a single bold glyph instead of fine
 * detail.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c1272d",
          borderRadius: 14,
          color: "#e5c547",
          fontSize: 48,
          fontWeight: 800,
          fontFamily: "serif",
        }}
      >
        a
      </div>
    ),
    size,
  )
}

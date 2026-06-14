import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/**
 * Apple touch icon — same glyph as favicon but iOS-sized. iOS rounds the
 * corners itself, so we don't bother with border-radius.
 */
export default function AppleIcon() {
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
          color: "#e5c547",
          fontSize: 130,
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

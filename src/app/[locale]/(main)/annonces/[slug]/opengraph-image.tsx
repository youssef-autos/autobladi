import { ImageResponse } from "next/og"

import { getAnnonceBySlug } from "@/lib/queries/annonce-detail"
import { formatPrice } from "@/lib/utils/format"

// Edge runtime required for next/og.
export const runtime = "edge"
export const alt = "autobladi.ma"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

type Params = { locale: string; slug: string }

/**
 * Generates the Open Graph card for a single annonce. Layout: red gradient
 * background, gold brand strip, title (clamped), price chip, optional cover
 * thumbnail. Falls back to a generic card if the annonce isn't found —
 * better than a broken image when crawlers hit stale URLs.
 */
export default async function AnnonceOgImage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale, slug } = await params
  const annonce = await getAnnonceBySlug(slug).catch(() => null)

  const ar = locale === "ar"
  const title = annonce?.title ?? "autobladi.ma"
  const price = annonce?.price ? formatPrice(annonce.price, "fr") : null
  const cover = annonce?.images[0]?.url ?? null
  const year = annonce?.year ?? null
  const city =
    (ar ? annonce?.city?.name_ar : annonce?.city?.name_fr) ?? null

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #c1272d 0%, #8c1a20 60%, #1a1a1a 100%)",
          color: "white",
          padding: "60px 70px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Gold top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background:
              "linear-gradient(90deg, #e5c547 0%, #e5c547 60%, transparent 100%)",
          }}
        />

        {/* Brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          autobladi
          <span style={{ color: "#e5c547" }}>.ma</span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: 36,
            marginTop: 30,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              gap: 18,
            }}
          >
            <h1
              style={{
                fontSize: 60,
                fontWeight: 800,
                lineHeight: 1.15,
                margin: 0,
                // 3-line clamp via inline style — ImageResponse supports it
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </h1>
            {(year || city) && (
              <div style={{ fontSize: 28, color: "rgba(255,255,255,0.85)" }}>
                {[year, city].filter(Boolean).join(" • ")}
              </div>
            )}
            {price && (
              <div
                style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  background: "#e5c547",
                  color: "#1a1a1a",
                  padding: "10px 22px",
                  borderRadius: 14,
                  fontSize: 40,
                  fontWeight: 800,
                  marginTop: 10,
                }}
              >
                {price}
              </div>
            )}
          </div>

          {cover && (
            <div
              style={{
                display: "flex",
                width: 420,
                height: 320,
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
                alignSelf: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover}
                alt=""
                width={420}
                height={320}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "rgba(255,255,255,0.7)",
            marginTop: 20,
          }}
        >
          <span>autobladi.ma</span>
          <span>{ar ? "سوق السيارات الأول في المغرب" : "Le marché auto au Maroc"}</span>
        </div>
      </div>
    ),
    size,
  )
}

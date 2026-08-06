import { ImageResponse } from "next/og"

import { getPostBySlug } from "@/lib/queries/blog"

export const runtime = "edge"
export const alt = "autobladi.ma — Blog"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

type Params = { locale: string; slug: string }

/**
 * Blog post OG card. If the post has a cover image we use it as a darkened
 * background; otherwise a Moroccan-themed gradient.
 */
export default async function BlogOgImage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale, slug } = await params
  const post = await getPostBySlug(slug).catch(() => null)

  const ar = locale === "ar"
  const title = post?.title ?? "autobladi.ma — Blog"
  const category =
    (ar ? post?.category?.name_ar : post?.category?.name_fr) ?? null
  const author = post?.author?.full_name ?? null
  const cover = post?.cover_image ?? null

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "linear-gradient(135deg, #1a1a1a 0%, #c1272d 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Cover background (low opacity) */}
        {cover && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
            }}
          >
            <img
              src={cover}
              alt=""
              width={1200}
              height={630}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.35,
              }}
            />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(26,26,26,0.85) 100%)",
          }}
        />

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

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "60px 70px",
            width: "100%",
            height: "100%",
            justifyContent: "space-between",
          }}
        >
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
            <span
              style={{
                marginLeft: 12,
                fontSize: 20,
                color: "rgba(255,255,255,0.6)",
                fontWeight: 500,
              }}
            >
              {ar ? "— المدونة" : "— Blog"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              maxWidth: 1060,
            }}
          >
            {category && (
              <div
                style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  background: "#e5c547",
                  color: "#1a1a1a",
                  padding: "6px 16px",
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {category}
              </div>
            )}
            <h1
              style={{
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.15,
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </h1>
            {author && (
              <div style={{ fontSize: 24, color: "rgba(255,255,255,0.8)" }}>
                {ar ? `بقلم ${author}` : `Par ${author}`}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    size,
  )
}

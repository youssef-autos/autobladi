import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // geolocation=(self): the showroom location picker's "use my current
  // location" button needs it for the site's own pages; still denied to any
  // third-party/embedded content.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
]

const nextConfig: NextConfig = {
  // Ship the watermark font with the /api/watermark serverless function — its
  // SVG text rendering embeds this file, which output tracing wouldn't include
  // on its own (it's read at runtime, not imported).
  outputFileTracingIncludes: {
    "/api/watermark": ["./src/assets/watermark-font.ttf"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
  async redirects() {
    // The dealer pages were renamed from /professionnel(s) to /showroom(s).
    // Keep old shared/indexed links working with permanent redirects.
    return [
      {
        source: "/:locale(ar|fr)/professionnels",
        destination: "/:locale/showrooms",
        permanent: true,
      },
      {
        source: "/:locale(ar|fr)/professionnel/:slug",
        destination: "/:locale/showroom/:slug",
        permanent: true,
      },
    ]
  },
  async rewrites() {
    // Ad-blocker evasion: serve storage images from a neutral first-party path
    // (`/media/*`) that proxies to the Supabase `ads` bucket. The browser never
    // sees `/ads/`, which EasyList-based blockers strip. See `src/lib/media.ts`.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const mediaRewrite = supabaseUrl
      ? [
          {
            source: "/media/:path*",
            destination: `${supabaseUrl}/storage/v1/object/public/ads/:path*`,
          },
        ]
      : []
    return [
      ...mediaRewrite,
      // Neutral alias for ad impression/click beacons so ad blockers (which
      // block `/api/ads/…`) don't drop first-party campaign analytics.
      {
        source: "/api/e/:id/:event",
        destination: "/api/ads/:id/:event",
      },
    ]
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
  },
  images: {
    // The Next 16 image optimizer refuses to fetch upstream images that
    // resolve to a "private" IP. On IPv6-only / DNS64+NAT64 dev networks
    // (e.g. some phone hotspots), public hosts resolve to a 64:ff9b:: NAT64
    // address that the guard misclassifies as private, so optimized images
    // fail to load locally. Skip optimization in development — the browser
    // then loads the storage URL directly. Production keeps optimization.
    unoptimized: process.env.NODE_ENV === "development",
    // Only optimize images from our own Supabase storage. Allowing any host
    // (`**`) would turn the Next image optimizer into an open proxy that
    // anyone could abuse to fetch/transform arbitrary remote images at our
    // bandwidth/CPU cost. All app images (car photos, avatars, brand logos,
    // ad creatives, blog covers) are uploaded to Supabase storage, so this
    // covers every case. If you later need an external CDN, add its exact
    // hostname here — never re-add the `**` wildcard.
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
}

export default withNextIntl(nextConfig)

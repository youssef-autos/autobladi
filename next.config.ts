import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
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

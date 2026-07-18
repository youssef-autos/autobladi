import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

/**
 * Robots policy:
 * - Allow everything except account-private surfaces (/admin, /dashboard)
 *   and HTTP-only endpoints (/api, /auth).
 * - Point crawlers at the sitemap so they can discover dynamic routes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

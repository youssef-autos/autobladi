/**
 * Ad-blocker-safe media URLs.
 *
 * All uploaded images (site logo, favicon, car-brand logos, blog covers, ad
 * creatives) live in a Supabase Storage bucket literally named `ads`, so their
 * public URLs contain `/storage/v1/object/public/ads/…`. Ad blockers (EasyList
 * et al.) block ANY request whose path contains `/ads/`, which silently strips
 * our logos for visitors who run one.
 *
 * `mediaUrl()` rewrites such a URL to a neutral first-party path
 * (`/media/…`). A Next.js rewrite (see `next.config.ts`) proxies `/media/*`
 * back to the storage bucket server-side, so the browser never sees `/ads/`.
 *
 * Returns a same-origin RELATIVE path (works identically in dev and prod, and
 * for the favicon `<link>`). URLs that don't point at the `ads` bucket — e.g.
 * car photos and avatars in other buckets — pass through untouched.
 */
const ADS_PUBLIC_MARKER = "/storage/v1/object/public/ads/"

export function mediaUrl<T extends string | null | undefined>(url: T): T {
  if (!url) return url
  const i = url.indexOf(ADS_PUBLIC_MARKER)
  if (i === -1) return url
  return (`/media/${url.slice(i + ADS_PUBLIC_MARKER.length)}`) as T
}

/**
 * Same rewrite as {@link mediaUrl} but for HTML blobs (e.g. blog post content
 * with inline `<img>`): replaces every absolute Supabase `ads`-bucket URL with
 * the neutral `/media/…` path so inline images aren't stripped by ad blockers.
 */
export function mediaHtml<T extends string | null | undefined>(html: T): T {
  if (!html) return html
  return html.replace(
    /https?:\/\/[^"'\s)]+\/storage\/v1\/object\/public\/ads\//g,
    "/media/",
  ) as T
}

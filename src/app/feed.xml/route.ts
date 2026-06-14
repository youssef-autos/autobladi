import { NextResponse } from "next/server"

import { listPostsForRss } from "@/lib/queries/blog"

export const revalidate = 600 // 10 minutes

// Minimal XML escaping for CDATA-free text nodes. We use CDATA for the
// description/content to dodge HTML entities, but the title and link still
// need basic escaping.
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"
  const posts = await listPostsForRss(20)

  const items = posts
    .map((post) => {
      // We don't know which locale this RSS reader wants, so default to /ar.
      const link = `${siteUrl}/ar/blog/${post.slug}`
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date().toUTCString()
      const excerpt = post.excerpt ?? post.title
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      ${post.author_name ? `<dc:creator><![CDATA[${post.author_name}]]></dc:creator>` : ""}
      <description><![CDATA[${excerpt}]]></description>
      ${post.cover_image ? `<enclosure url="${escapeXml(post.cover_image)}" type="image/jpeg" />` : ""}
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>autobladi.ma — Blog</title>
    <link>${siteUrl}/ar/blog</link>
    <description>Actualités et conseils automobiles au Maroc — autobladi.ma</description>
    <language>ar</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  })
}

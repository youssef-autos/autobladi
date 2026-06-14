// Serves the IndexNow key at https://autobladi.ma/indexnow.txt so search
// engines can verify domain ownership. Referenced as `keyLocation` in the
// IndexNow submissions (see src/lib/seo/indexnow.ts).

export const dynamic = "force-static"
export const revalidate = false

export function GET() {
  const key = process.env.INDEXNOW_KEY ?? ""
  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

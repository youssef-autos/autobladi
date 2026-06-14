import { NextResponse, type NextRequest } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Increments the `impressions` counter on an advertisement.
 *
 * Same dedup pattern as the click route, but with a tighter 10-minute window
 * — impressions fire on mount so we want to be a bit more aggressive against
 * tab-cycling and rapid revisits.
 */
const RECENT = new Map<string, number>()
const WINDOW_MS = 10 * 60 * 1000

function recentlyCounted(key: string): boolean {
  const now = Date.now()
  const last = RECENT.get(key)
  if (RECENT.size > 5000) {
    for (const [k, t] of RECENT) {
      if (now - t > WINDOW_MS) RECENT.delete(k)
    }
  }
  if (last && now - last < WINDOW_MS) return true
  RECENT.set(key, now)
  return false
}

function getIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown"
  return req.headers.get("x-real-ip") ?? "unknown"
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 })
  }

  const ip = getIp(req)
  if (recentlyCounted(`${id}:${ip}`)) {
    return NextResponse.json({ ok: true, deduped: true })
  }

  try {
    const admin = createAdminClient()
    // Same workaround as the click route — see comment there.
    const { error } = await admin.rpc("increment_ad_impression", {
      p_ad_id: id,
    } as never)
    if (error) {
      return NextResponse.json(
        { ok: false, error: "server_error" },
        { status: 500 },
      )
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

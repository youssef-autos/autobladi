import { NextResponse, type NextRequest } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Increments blog_posts.views_count.
 *
 * Idempotency: per (postId, IP) within a 10-minute window. Same pattern as
 * the annonces /view route — survives only the lifetime of the Node
 * process. The actual UPDATE goes through the SECURITY DEFINER RPC
 * increment_blog_view (see migration 009).
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
    const { error } = await admin.rpc("increment_blog_view", {
      p_post_id: id,
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

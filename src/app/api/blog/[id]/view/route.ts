import { NextResponse, type NextRequest } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Increments blog_posts.views_count.
 *
 * Idempotency: per (postId, IP) within a 10-minute window. Same pattern as
 * the annonces /view route — survives only the lifetime of the Node
 * process.
 *
 * Does a plain select-then-update (like the annonces route) rather than
 * going through a SECURITY DEFINER RPC: this route already runs on the
 * admin client, so the RPC's only purpose — letting an untrusted caller
 * bump the counter without table-level UPDATE grants — isn't in play here.
 * (The increment_blog_view() function this used to call was never actually
 * applied to the database despite being in schema.sql, which silently
 * 500'd on every view and kept every post's count at 0.)
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
    const { data: row } = await admin
      .from("blog_posts")
      .select("views_count")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle<{ views_count: number }>()

    if (!row) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    }

    await admin
      .from("blog_posts")
      .update({ views_count: (row.views_count ?? 0) + 1 } as never)
      .eq("id", id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[blog view] failed to increment", err)
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

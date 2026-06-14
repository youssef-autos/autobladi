import { NextResponse, type NextRequest } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Increments views_count for an annonce.
 *
 * Idempotency: a simple in-memory LRU keyed by (annonceId, IP) within a
 * 10-minute window. Survives only the lifetime of the Node process — for
 * persistent dedup, replace with Redis or a Postgres function. The IP-derived
 * key blocks rapid refreshes but is intentionally loose so it doesn't punish
 * legitimate revisits.
 */
const RECENT = new Map<string, number>()
const WINDOW_MS = 10 * 60 * 1000

function recentlyCounted(key: string): boolean {
  const now = Date.now()
  const last = RECENT.get(key)
  // Opportunistic GC
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
      .from("annonces")
      .select("views_count")
      .eq("id", id)
      .maybeSingle<{ views_count: number }>()

    if (!row) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    }

    await admin
      .from("annonces")
      .update({ views_count: (row.views_count ?? 0) + 1 } as never)
      .eq("id", id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

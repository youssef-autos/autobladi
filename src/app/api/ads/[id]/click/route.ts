import { NextResponse, type NextRequest } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Increments the `clicks` counter on an advertisement.
 *
 * Idempotency: a small in-memory LRU keyed by (adId, IP) within a 5-minute
 * window. Survives only the lifetime of the Node process — for persistent
 * dedup, replace with Redis or a Postgres table. The IP-derived key blocks
 * rapid clicks from the same visitor but is intentionally loose so it
 * doesn't punish legitimate repeated interest.
 *
 * The actual UPDATE goes through the SECURITY DEFINER RPC `increment_ad_click`
 * (see migration 007), so we don't depend on direct table-write privileges.
 */
const RECENT = new Map<string, number>()
const WINDOW_MS = 5 * 60 * 1000

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
    // The supabase-js rpc generic narrows Args poorly when Returns is void;
    // assert the args shape to keep the call site readable.
    const { error } = await admin.rpc("increment_ad_click", {
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

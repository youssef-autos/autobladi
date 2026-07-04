import { NextResponse, type NextRequest } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/**
 * Records a granular ad event (view / phone_click / whatsapp_click) into
 * `ad_events` — the log behind the Pro "advanced statistics" dashboard.
 *
 * Views are deduped per (annonce, IP) within a 30-minute window and never
 * counted for the annonce owner. The legacy `views_count` counter at
 * /api/annonces/[id]/view is untouched — this endpoint only adds detail.
 *
 * `message` events are recorded server-side by the sendMessage action, not
 * through this endpoint (the action already knows the send succeeded).
 */
const EVENTS = ["view", "phone_click", "whatsapp_click"] as const
type TrackEvent = (typeof EVENTS)[number]

const RECENT = new Map<string, number>()
const WINDOW_MS = 30 * 60 * 1000

function recentlyTracked(key: string): boolean {
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

/**
 * Maps the visitor's original referrer (document.referrer, sent by the
 * client) to a coarse traffic source.
 */
function inferSource(referrer: unknown, requestOrigin: string): string {
  if (typeof referrer !== "string" || !referrer.trim()) return "direct"
  let url: URL
  try {
    url = new URL(referrer)
  } catch {
    return "other"
  }
  // External site (search engines, social, …) → the visitor came from outside.
  if (url.origin !== requestOrigin) return "direct"
  const path = url.pathname.replace(/^\/(ar|fr)(?=\/|$)/, "")
  if (path === "" || path === "/") return "homepage"
  if (path === "/annonces" || path.startsWith("/annonces?")) return "search"
  if (url.pathname.includes("/professionnel/")) return "dealer_page"
  return "other"
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 })
  }

  let body: { event?: unknown; referrer?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    // empty body — rejected below
  }
  const event = body.event
  if (typeof event !== "string" || !EVENTS.includes(event as TrackEvent)) {
    return NextResponse.json({ ok: false, error: "bad_event" }, { status: 400 })
  }

  // Views: one per visitor per half hour, and never the owner's own visits.
  if (event === "view") {
    if (recentlyTracked(`${id}:${getIp(req)}`)) {
      return NextResponse.json({ ok: true, deduped: true })
    }
  }

  try {
    const admin = createAdminClient()
    const { data: annonce } = await admin
      .from("annonces")
      .select("user_id")
      .eq("id", id)
      .maybeSingle<{ user_id: string }>()
    if (!annonce) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    }

    // Skip the owner's own activity (views AND clicks would skew their stats).
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user && user.id === annonce.user_id) {
      return NextResponse.json({ ok: true, owner: true })
    }

    const { error } = await admin.from("ad_events").insert({
      ad_id: id,
      event_type: event,
      source: inferSource(body.referrer, req.nextUrl.origin),
    } as never)
    if (error) {
      // Table missing (migration not applied yet) or transient DB error.
      return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    // Table missing or transient DB error — tracking is best-effort.
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

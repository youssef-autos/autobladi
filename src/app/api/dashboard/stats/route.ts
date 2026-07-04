import { NextResponse, type NextRequest } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/**
 * Advanced statistics for the Pro dashboard, aggregated from `ad_events`.
 *
 * Pro-only: the plan check happens HERE (backend), so free accounts get a 403
 * even when calling the endpoint directly. The gate matches the convention
 * used across the app: profiles.account_type in ('pro', 'admin').
 */
export type AdvancedStatsPayload = {
  days: number
  totals: {
    views: number
    phoneClicks: number
    whatsappClicks: number
    messages: number
    /** (phone + whatsapp + messages) / views, 0..1 */
    conversion: number
  }
  /** Total views per day, oldest first — includes zero-filled days. */
  daily: Array<{ date: string; views: number }>
  /** View source distribution, percentages of total views. */
  sources: Array<{ source: string; count: number; percent: number }>
  perAnnonce: Array<{
    id: string
    title: string
    slug: string
    views: number
    phoneClicks: number
    whatsappClicks: number
    messages: number
    conversion: number
    daily: Array<{ date: string; views: number }>
  }>
}

type EventRow = {
  ad_id: string
  event_type: string
  source: string
  created_at: string
}

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

/** Zero-filled list of the last `days` day-keys, oldest first. */
function dayRange(days: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  if (!profile || !["pro", "admin"].includes(profile.account_type)) {
    return NextResponse.json({ ok: false, error: "pro_required" }, { status: 403 })
  }

  const days = req.nextUrl.searchParams.get("days") === "7" ? 7 : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const admin = createAdminClient()

  const { data: annonces } = await admin
    .from("annonces")
    .select("id, title, slug")
    .eq("user_id", user.id)
  const mine = (annonces ?? []) as Array<{ id: string; title: string; slug: string }>

  const emptyPayload: AdvancedStatsPayload = {
    days,
    totals: { views: 0, phoneClicks: 0, whatsappClicks: 0, messages: 0, conversion: 0 },
    daily: dayRange(days).map((date) => ({ date, views: 0 })),
    sources: [],
    perAnnonce: [],
  }
  if (mine.length === 0) return NextResponse.json({ ok: true, stats: emptyPayload })

  const { data: events } = await admin
    .from("ad_events")
    .select("ad_id, event_type, source, created_at")
    .in("ad_id", mine.map((a) => a.id))
    .gte("created_at", since)
  const rows = (events ?? []) as EventRow[]

  const range = dayRange(days)
  const totalDaily = new Map(range.map((d) => [d, 0]))
  const sourceCounts = new Map<string, number>()
  const byAnnonce = new Map(
    mine.map((a) => [
      a.id,
      {
        ...a,
        views: 0,
        phoneClicks: 0,
        whatsappClicks: 0,
        messages: 0,
        daily: new Map(range.map((d) => [d, 0])),
      },
    ]),
  )

  let views = 0
  let phoneClicks = 0
  let whatsappClicks = 0
  let messages = 0

  for (const row of rows) {
    const entry = byAnnonce.get(row.ad_id)
    if (!entry) continue
    switch (row.event_type) {
      case "view": {
        views++
        entry.views++
        sourceCounts.set(row.source, (sourceCounts.get(row.source) ?? 0) + 1)
        const key = dayKey(row.created_at)
        if (totalDaily.has(key)) totalDaily.set(key, (totalDaily.get(key) ?? 0) + 1)
        if (entry.daily.has(key)) entry.daily.set(key, (entry.daily.get(key) ?? 0) + 1)
        break
      }
      case "phone_click":
        phoneClicks++
        entry.phoneClicks++
        break
      case "whatsapp_click":
        whatsappClicks++
        entry.whatsappClicks++
        break
      case "message":
        messages++
        entry.messages++
        break
    }
  }

  const conversion = (v: number, interactions: number) =>
    v > 0 ? interactions / v : 0

  const stats: AdvancedStatsPayload = {
    days,
    totals: {
      views,
      phoneClicks,
      whatsappClicks,
      messages,
      conversion: conversion(views, phoneClicks + whatsappClicks + messages),
    },
    daily: range.map((date) => ({ date, views: totalDaily.get(date) ?? 0 })),
    sources: [...sourceCounts.entries()]
      .map(([source, count]) => ({
        source,
        count,
        percent: views > 0 ? Math.round((count / views) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count),
    perAnnonce: [...byAnnonce.values()]
      .map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        views: a.views,
        phoneClicks: a.phoneClicks,
        whatsappClicks: a.whatsappClicks,
        messages: a.messages,
        conversion: conversion(a.views, a.phoneClicks + a.whatsappClicks + a.messages),
        daily: range.map((date) => ({ date, views: a.daily.get(date) ?? 0 })),
      }))
      .sort((a, b) => b.views - a.views),
  }

  return NextResponse.json({ ok: true, stats })
}

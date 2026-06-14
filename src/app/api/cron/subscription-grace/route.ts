import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getRecipientById } from "@/lib/email/recipients"
import { sendSubscriptionGraceEmail } from "@/lib/email/send"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DAY = 86_400_000
const DEFAULT_GRACE_DAYS = 7

/**
 * Daily job: handles the post-expiry grace window for pro accounts.
 *  - In grace  → send a daily reminder email (days left before suspension).
 *  - Past grace → suspend: downgrade to gratuit + hide the professionnel,
 *                 and send a final "suspended" email.
 *
 * Protect with CRON_SECRET. Call once a day from any scheduler, e.g.:
 *   Vercel cron (vercel.json):
 *     { "crons": [{ "path": "/api/cron/subscription-grace", "schedule": "0 6 * * *" }] }
 *     and set CRON_SECRET; Vercel sends it as the Authorization bearer.
 *   Or cron-job.org / GitHub Actions:
 *     curl -H "Authorization: Bearer $CRON_SECRET" \
 *       https://autobladi.ma/api/cron/subscription-grace
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get("authorization")
  if (header === `Bearer ${secret}`) return true
  return new URL(req.url).searchParams.get("secret") === secret
}

function toNumber(raw: unknown, fallback: number): number {
  if (typeof raw === "number" && raw >= 0) return raw
  if (typeof raw === "string" && !Number.isNaN(Number(raw))) return Number(raw)
  return fallback
}

type SubRow = {
  user_id: string
  ends_at: string | null
  subscription_plans: { name: string | null; name_ar: string | null } | null
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = Date.now()

  // Admin-configured grace window.
  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "subscription_grace_days")
    .maybeSingle<{ value: unknown }>()
  const graceDays = toNumber(setting?.value, DEFAULT_GRACE_DAYS)

  // All pro accounts.
  const { data: pros } = await supabase
    .from("profiles")
    .select("id")
    .eq("account_type", "pro")
  const proIds = (pros ?? []).map((p) => (p as { id: string }).id)
  if (proIds.length === 0) {
    return NextResponse.json({ ok: true, graceDays, reminded: 0, suspended: 0 })
  }

  // Their approved subscriptions; we keep, per user, the furthest ends_at.
  const { data: subsData } = await supabase
    .from("subscription_requests")
    .select("user_id, ends_at, subscription_plans(name, name_ar)")
    .in("user_id", proIds)
    .eq("status", "approved")
  const subs = (subsData ?? []) as unknown as SubRow[]

  type Acc = { endsAt: number | null; lifetime: boolean; planName: string }
  const latest = new Map<string, Acc>()
  for (const s of subs) {
    const planName = s.subscription_plans?.name ?? ""
    const cur = latest.get(s.user_id) ?? { endsAt: null, lifetime: false, planName }
    if (s.ends_at === null) {
      cur.lifetime = true // a never-expiring (lifetime) sub keeps them active
    } else {
      const t = new Date(s.ends_at).getTime()
      if (cur.endsAt === null || t > cur.endsAt) {
        cur.endsAt = t
        cur.planName = planName
      }
    }
    latest.set(s.user_id, cur)
  }

  let reminded = 0
  let suspended = 0
  const errors: string[] = []

  for (const [userId, acc] of latest) {
    if (acc.lifetime || acc.endsAt === null) continue // never expires
    if (acc.endsAt >= now) continue // still active

    const suspendAt = acc.endsAt + graceDays * DAY

    try {
      if (now < suspendAt) {
        // Still in grace — daily reminder.
        const daysLeft = Math.max(1, Math.ceil((suspendAt - now) / DAY))
        const r = await getRecipientById(userId)
        if (r) {
          await sendSubscriptionGraceEmail({
            to: r.email,
            name: r.name,
            planName: acc.planName,
            daysLeft,
            lang: r.lang,
          })
          reminded++
        }
      } else {
        // Grace elapsed — suspend the pro services.
        await supabase
          .from("profiles")
          .update({ account_type: "gratuit" } as never)
          .eq("id", userId)
        await supabase
          .from("professionnels")
          .update({ is_active: false } as never)
          .eq("user_id", userId)

        const r = await getRecipientById(userId)
        if (r) {
          await sendSubscriptionGraceEmail({
            to: r.email,
            name: r.name,
            planName: acc.planName,
            daysLeft: 0,
            lang: r.lang,
          })
        }
        suspended++
      }
    } catch (e) {
      errors.push(`${userId}: ${(e as Error).message}`)
    }
  }

  return NextResponse.json({
    ok: true,
    graceDays,
    reminded,
    suspended,
    ...(errors.length ? { errors } : {}),
  })
}

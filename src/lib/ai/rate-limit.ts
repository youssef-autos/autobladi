import "server-only"

/**
 * Sliding-window in-memory rate limiter.
 *
 * Tradeoffs:
 *  - Per-process: each Node instance has its own counter. Behind a load
 *    balancer the effective limit is N × max. Acceptable starting point —
 *    swap for Upstash (`@upstash/ratelimit` + `@upstash/redis`) when you
 *    need true distributed accounting.
 *  - State lives in module scope; resets on cold start. That's fine for
 *    short windows (minutes / hours) but not for daily quotas on a flaky
 *    serverless platform.
 *
 * To switch to Upstash later:
 *   1. npm i @upstash/ratelimit @upstash/redis
 *   2. set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   3. replace `checkRateLimit` with a thin wrapper around Ratelimit.limit()
 */

const buckets = new Map<string, number[]>()
const GC_THRESHOLD = 5_000

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  /** Seconds to wait before retrying (only relevant when !allowed). */
  retryAfter: number
}

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const cutoff = now - windowMs

  // Opportunistic GC so the map doesn't grow without bound
  if (buckets.size > GC_THRESHOLD) {
    for (const [k, hits] of buckets) {
      const filtered = hits.filter((t) => t > cutoff)
      if (filtered.length === 0) buckets.delete(k)
      else buckets.set(k, filtered)
    }
  }

  const recent = (buckets.get(key) ?? []).filter((t) => t > cutoff)
  if (recent.length >= max) {
    const oldest = recent[0] ?? now
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    return { allowed: false, remaining: 0, retryAfter }
  }

  recent.push(now)
  buckets.set(key, recent)
  return { allowed: true, remaining: Math.max(0, max - recent.length), retryAfter: 0 }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown"
  return req.headers.get("x-real-ip") ?? "unknown"
}

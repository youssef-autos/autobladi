import "server-only"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"
const KEY = process.env.INDEXNOW_KEY ?? ""

/**
 * Notifies IndexNow (Bing + Yandex, and Google is trialing it) that URLs
 * changed, so new/updated listings get crawled within minutes instead of days.
 *
 * Pass locale-less paths starting with "/" (e.g. "/annonces/dacia-duster-2024");
 * each expands to its ar + fr URLs. Best-effort and fire-and-forget — never
 * throws, so it can't break the action that triggered it. No-op without a key.
 */
export async function pingIndexNow(paths: string[]): Promise<void> {
  if (!KEY || paths.length === 0) return
  let host: string
  try {
    host = new URL(SITE_URL).host
  } catch {
    return
  }
  // Skip on non-public hosts (localhost / preview) — IndexNow needs a real domain.
  if (host === "localhost" || host.startsWith("127.") || host.endsWith(".local")) {
    return
  }

  const urlList = paths.flatMap((p) => [
    `${SITE_URL}/ar${p}`,
    `${SITE_URL}/fr${p}`,
  ])

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: KEY,
        keyLocation: `${SITE_URL}/indexnow.txt`,
        urlList,
      }),
    })
  } catch {
    // ignore — indexing hints are best-effort
  }
}

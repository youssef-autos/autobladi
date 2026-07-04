/**
 * Fire-and-forget beacon for the Pro advanced-stats event log (`ad_events`).
 * Sends the visitor's original referrer so the server can infer the traffic
 * source. Failures are swallowed — tracking must never break the UI.
 */
export function trackAdEvent(
  annonceId: string,
  event: "view" | "phone_click" | "whatsapp_click",
): void {
  if (!annonceId) return
  try {
    void fetch(`/api/annonces/${annonceId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, referrer: document.referrer }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // ignore — best-effort
  }
}

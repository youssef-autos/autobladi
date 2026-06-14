/**
 * Turns a YouTube / Facebook / TikTok watch URL into an embeddable iframe src.
 * Returns the orientation too so vertical clips (Shorts / TikTok) get the right
 * aspect ratio. Unsupported or malformed URLs yield null (caller hides the UI).
 */
export type VideoEmbed = { src: string; vertical: boolean }

export function getVideoEmbed(raw: string | null | undefined): VideoEmbed | null {
  if (!raw) return null
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase()

  // YouTube — watch?v=, youtu.be/<id>, /shorts/<id>, /embed/<id>
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    const v = u.searchParams.get("v")
    if (v) return { src: `https://www.youtube.com/embed/${v}`, vertical: false }
    const shorts = u.pathname.match(/^\/shorts\/([\w-]+)/)
    if (shorts) return { src: `https://www.youtube.com/embed/${shorts[1]}`, vertical: true }
    const embed = u.pathname.match(/^\/embed\/([\w-]+)/)
    if (embed) return { src: `https://www.youtube.com/embed/${embed[1]}`, vertical: false }
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0]
    if (id) return { src: `https://www.youtube.com/embed/${id}`, vertical: false }
  }

  // TikTok — /@user/video/<id>
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const m = u.pathname.match(/\/video\/(\d+)/)
    if (m) return { src: `https://www.tiktok.com/embed/v2/${m[1]}`, vertical: true }
  }

  // Facebook — official video plugin with the original URL
  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch") {
    const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      raw.trim(),
    )}&show_text=false`
    return { src, vertical: false }
  }

  return null
}

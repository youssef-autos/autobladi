export const COLORS = {
  red: "#c1272d",
  gold: "#e5c547",
  sand: "#fdfaf5",
  mint: "#0d7a5f",
  dark: "#1a1a1a",
  text: "#333333",
  muted: "#666666",
  border: "#ececec",
  bg: "#f6f4ef",
} as const

export { COLORS as default }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function emailLayout({
  preview,
  lang = "ar",
  unsubscribeUrl,
  body,
}: {
  preview: string
  lang?: "ar" | "fr"
  unsubscribeUrl?: string
  body: string
}): string {
  const dir = lang === "ar" ? "rtl" : "ltr"
  const fontFamily =
    lang === "ar"
      ? "'Cairo','Tajawal',Arial,sans-serif"
      : "Inter,'Helvetica Neue',Arial,sans-serif"
  const footerTag =
    lang === "ar"
      ? "سوق السيارات الأول في المغرب"
      : "Le marché automobile #1 au Maroc"
  const contactLabel = lang === "ar" ? "اتصل بنا" : "Contact"
  const privacyLabel = lang === "ar" ? "الخصوصية" : "Confidentialité"
  const domain = SITE_URL.replace(/^https?:\/\//, "")
  const year = new Date().getFullYear()

  const unsubscribeHtml = unsubscribeUrl
    ? `<p style="margin:6px 0 0 0;font-size:11px;color:${COLORS.muted};">
        <a href="${esc(unsubscribeUrl)}" style="color:${COLORS.muted};">
          ${lang === "ar" ? "إلغاء الاشتراك في النشرة" : "Se désabonner de la newsletter"}
        </a>
      </p>`
    : ""

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="${dir}" lang="${lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
  <meta name="x-apple-disable-message-reformatting"/>
</head>
<body style="background-color:${COLORS.bg};font-family:${fontFamily};margin:0;padding:24px 0;">
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${esc(preview)}</div>
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${COLORS.border};">
    <div style="background:${COLORS.red};padding:20px 32px;text-align:center;">
      <a href="${SITE_URL}" style="color:#ffffff;text-decoration:none;font-size:22px;font-weight:700;font-family:Georgia,'Playfair Display',serif;">
        autobladi<span style="color:${COLORS.gold};">.ma</span>
      </a>
    </div>
    <div style="padding:32px;">${body}</div>
    <div style="border-top:1px solid ${COLORS.border};margin:0;"></div>
    <div style="padding:20px 32px;background:${COLORS.sand};text-align:center;">
      <p style="margin:0 0 8px 0;font-size:12px;color:${COLORS.muted};">autobladi.ma — ${footerTag}</p>
      <p style="margin:0 0 12px 0;font-size:12px;">
        <a href="${SITE_URL}" style="color:${COLORS.red};margin-inline-end:12px;">${domain}</a>
        <a href="${SITE_URL}/${lang}/contact" style="color:${COLORS.red};margin-inline-end:12px;">${contactLabel}</a>
        <a href="${SITE_URL}/${lang}/privacy" style="color:${COLORS.red};">${privacyLabel}</a>
      </p>
      ${unsubscribeHtml}
      <p style="margin:8px 0 0 0;font-size:11px;color:${COLORS.muted};">© ${year} autobladi.ma</p>
    </div>
  </div>
</body>
</html>`
}

export function emailHeading(text: string, align: "start" | "center" = "start"): string {
  return `<p style="font-size:22px;font-weight:700;color:${COLORS.dark};margin:0 0 12px 0;text-align:${align};line-height:1.3;">${esc(text)}</p>`
}

export function emailParagraph(text: string, muted = false): string {
  return `<p style="font-size:15px;line-height:1.6;color:${muted ? COLORS.muted : COLORS.text};margin:0 0 16px 0;">${esc(text)}</p>`
}

export function emailButton(href: string, label: string): string {
  return `<div style="text-align:center;padding:8px 0 24px 0;">
    <a href="${esc(href)}" style="display:inline-block;background:${COLORS.red};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:15px;font-weight:600;">${esc(label)}</a>
  </div>`
}

export function emailGoldBox(text: string): string {
  return `<div style="background:${COLORS.gold}1A;border:1px solid ${COLORS.gold}66;border-radius:10px;padding:16px;margin:12px 0 20px 0;">
    <p style="margin:0;font-size:14px;color:${COLORS.dark};">${esc(text)}</p>
  </div>`
}

export function emailRedBox(label: string, text: string): string {
  return `<div style="background:#fef2f2;border:1px solid ${COLORS.red}33;border-radius:10px;padding:16px;margin:12px 0 20px 0;">
    <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;color:${COLORS.red};text-transform:uppercase;">${esc(label)}</p>
    <p style="margin:0;font-size:14px;color:${COLORS.dark};">${esc(text)}</p>
  </div>`
}

export function emailInfoBox(rows: Array<{ label: string; value: string }>): string {
  const rowsHtml = rows
    .map(
      (r) =>
        `<p style="margin:4px 0;font-size:14px;color:${COLORS.text};"><strong style="color:${COLORS.dark};">${esc(r.label)}: </strong>${esc(r.value)}</p>`,
    )
    .join("")
  return `<div style="background:${COLORS.sand};border:1px solid ${COLORS.border};border-radius:10px;padding:16px;margin:12px 0 20px 0;">${rowsHtml}</div>`
}

export function emailSectionLabel(label: string): string {
  return `<p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:${COLORS.muted};text-transform:uppercase;">${esc(label)}</p>`
}

export function emailMessageBox(text: string): string {
  return `<div style="background:#fafafa;border:1px solid ${COLORS.border};border-radius:10px;padding:16px;margin:0 0 20px 0;">
    <p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.text};white-space:pre-wrap;">${esc(text)}</p>
  </div>`
}

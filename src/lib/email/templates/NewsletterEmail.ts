import { COLORS, emailHeading, emailLayout, emailParagraph, esc } from "../layout"

export type NewsletterItem = {
  title: string
  excerpt: string | null
  url: string
  imageUrl?: string | null
}

type Props = {
  preheader: string
  introHeading: string
  introText: string
  items: NewsletterItem[]
  unsubscribeUrl: string
  lang?: "ar" | "fr"
}

function newsletterItem(item: NewsletterItem, ar: boolean): string {
  return `<div style="border-top:1px solid ${COLORS.border};padding-top:20px;margin-top:20px;">
    ${item.imageUrl ? `<img src="${esc(item.imageUrl)}" alt="" width="536" style="width:100%;max-width:536px;height:auto;border-radius:10px;display:block;margin-bottom:12px;">` : ""}
    <a href="${esc(item.url)}" style="font-size:18px;font-weight:700;color:${COLORS.dark};text-decoration:none;">${esc(item.title)}</a>
    ${item.excerpt ? `<p style="margin:8px 0 12px 0;font-size:14px;line-height:1.6;color:${COLORS.text};">${esc(item.excerpt)}</p>` : ""}
    <a href="${esc(item.url)}" style="font-size:14px;font-weight:600;color:${COLORS.red};text-decoration:none;">${ar ? "اقرأ المزيد ←" : "Lire la suite →"}</a>
  </div>`
}

export function NewsletterEmail({ preheader, introHeading, introText, items, unsubscribeUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: preheader,
    unsubscribeUrl,
    body:
      emailHeading(introHeading) +
      emailParagraph(introText) +
      items.map((item) => newsletterItem(item, ar)).join(""),
  })
}

export default NewsletterEmail

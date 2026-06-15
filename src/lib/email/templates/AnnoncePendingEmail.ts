import { emailButton, emailHeading, emailLayout, emailParagraph } from "../layout"

type Props = { name: string; annonceTitle: string; dashboardUrl: string; lang?: "ar" | "fr" }

export function AnnoncePendingEmail({ name, annonceTitle, dashboardUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? `إعلانك "${annonceTitle}" قيد المراجعة` : `Votre annonce "${annonceTitle}" est en cours de revue`,
    body:
      emailHeading(ar ? `شكراً ${name} 🙌` : `Merci ${name} 🙌`) +
      emailParagraph(
        ar
          ? `استلمنا إعلانك "${annonceTitle}". سيراجعه فريقنا خلال 24 ساعة وسنُعلمك بمجرد نشره.`
          : `Nous avons reçu votre annonce "${annonceTitle}". Notre équipe la passera en revue sous 24h et nous vous préviendrons une fois publiée.`,
      ) +
      emailButton(dashboardUrl, ar ? "تابع حالة إعلانك" : "Suivre l'état de l'annonce") +
      emailParagraph(
        ar
          ? "لتسريع المراجعة، تأكّد أن الصور واضحة وأن العنوان والوصف يتطابقان مع السيارة."
          : "Pour accélérer la revue, assurez-vous que les photos sont nettes et que le titre/description correspondent au véhicule.",
        true,
      ),
  })
}

export default AnnoncePendingEmail

import { emailButton, emailHeading, emailLayout, emailParagraph, emailRedBox } from "../layout"

type Props = { name: string; annonceTitle: string; reason: string; editUrl: string; lang?: "ar" | "fr" }

export function AnnonceRejectedEmail({ name, annonceTitle, reason, editUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? `إعلانك "${annonceTitle}" بحاجة لتعديل` : `Votre annonce "${annonceTitle}" nécessite des modifications`,
    body:
      emailHeading(ar ? `${name}، إعلانك يحتاج لتعديل` : `${name}, votre annonce a besoin d'ajustements`) +
      emailParagraph(
        ar
          ? `راجعنا إعلانك "${annonceTitle}" ووجدنا أنه يحتاج لبعض التعديلات قبل النشر.`
          : `Nous avons revu votre annonce "${annonceTitle}" et elle nécessite quelques modifications avant publication.`,
      ) +
      emailRedBox(ar ? "سبب الرفض" : "Motif", reason) +
      emailButton(editUrl, ar ? "تعديل الإعلان" : "Modifier l'annonce") +
      emailParagraph(
        ar
          ? "بعد التعديل سيُعاد الإعلان لقائمة المراجعة تلقائياً."
          : "Une fois modifiée, l'annonce repassera automatiquement en revue.",
        true,
      ),
  })
}

export default AnnonceRejectedEmail

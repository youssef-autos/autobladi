import { emailButton, emailHeading, emailLayout, emailParagraph, emailRedBox } from "../layout"

type Props = { name: string; planName: string; reason: string; retryUrl: string; lang?: "ar" | "fr" }

export function SubscriptionRejectedEmail({ name, planName, reason, retryUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? `طلب اشتراك ${planName} - يحتاج لتوضيح` : `Demande d'abonnement ${planName} - clarification`,
    body:
      emailHeading(ar ? `${name}، طلب الاشتراك` : `${name}, votre demande d'abonnement`) +
      emailParagraph(
        ar
          ? `لم نتمكّن من تأكيد تحويلك البنكي لباقة "${planName}". يرجى مراجعة الملاحظات وإعادة الإرسال مع الإثباتات الصحيحة.`
          : `Nous n'avons pas pu valider votre virement pour l'abonnement "${planName}". Vérifiez les remarques et soumettez à nouveau avec les justificatifs corrects.`,
      ) +
      emailRedBox(ar ? "السبب" : "Motif", reason) +
      emailButton(retryUrl, ar ? "إعادة الطلب" : "Soumettre à nouveau"),
  })
}

export default SubscriptionRejectedEmail

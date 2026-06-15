import { emailButton, emailHeading, emailLayout, emailParagraph, emailRedBox } from "../layout"

type Props = { name: string; reason: string; retryUrl: string; lang?: "ar" | "fr" }

export function VerificationRejectedEmail({ name, reason, retryUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? "طلب التوثيق يحتاج لمعلومات إضافية" : "La vérification nécessite des informations supplémentaires",
    body:
      emailHeading(ar ? `${name}، طلب التوثيق` : `${name}, votre demande de vérification`) +
      emailParagraph(
        ar
          ? "للأسف، لم نتمكّن من اعتماد طلب التوثيق الخاص بك. يمكنك إعادة الإرسال بعد تصحيح الملاحظات أدناه."
          : "Nous n'avons pas pu valider votre demande de vérification. Vous pouvez la renvoyer après correction.",
      ) +
      emailRedBox(ar ? "الملاحظات" : "Remarques", reason) +
      emailButton(retryUrl, ar ? "إعادة إرسال الطلب" : "Renvoyer la demande"),
  })
}

export default VerificationRejectedEmail

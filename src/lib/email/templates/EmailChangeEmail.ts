import { emailButton, emailHeading, emailLayout, emailParagraph } from "../layout"

type Props = { newEmail: string; confirmUrl: string; lang?: "ar" | "fr" }

export function EmailChangeEmail({ newEmail, confirmUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? "تأكيد تغيير البريد الإلكتروني" : "Confirmer le changement d'e-mail",
    body:
      emailHeading(ar ? "تأكيد تغيير البريد الإلكتروني ✉️" : "Confirmer le changement d'e-mail ✉️") +
      emailParagraph(
        ar
          ? `تلقّينا طلباً لتغيير البريد الإلكتروني لحسابك إلى ${newEmail}. اضغط على الزر أدناه لتأكيد هذا التغيير. الرابط صالح لمدة ساعة.`
          : `Nous avons reçu une demande de changement de l'adresse e-mail de votre compte vers ${newEmail}. Cliquez sur le bouton ci-dessous pour confirmer ce changement. Le lien est valable 1 heure.`,
      ) +
      emailButton(confirmUrl, ar ? "تأكيد التغيير" : "Confirmer le changement") +
      emailParagraph(
        ar
          ? "إذا لم تطلب هذا الإجراء، تجاهل هذا الإيميل — بريدك الإلكتروني لن يتغيّر."
          : "Si vous n'avez pas demandé cette action, ignorez ce message — votre e-mail restera inchangé.",
        true,
      ),
  })
}

export default EmailChangeEmail

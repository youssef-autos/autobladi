import { emailButton, emailHeading, emailLayout, emailParagraph } from "../layout"

type Props = { resetUrl: string; lang?: "ar" | "fr" }

export function PasswordResetEmail({ resetUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? "إعادة تعيين كلمة المرور" : "Réinitialisation de mot de passe",
    body:
      emailHeading(ar ? "إعادة تعيين كلمة المرور 🔒" : "Réinitialiser votre mot de passe 🔒") +
      emailParagraph(
        ar
          ? "تلقّينا طلبك لإعادة تعيين كلمة المرور. اضغط على الزر أدناه لاختيار كلمة مرور جديدة. الرابط صالح لمدة ساعة."
          : "Nous avons reçu votre demande de réinitialisation. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Le lien est valable 1 heure.",
      ) +
      emailButton(resetUrl, ar ? "تعيين كلمة مرور جديدة" : "Réinitialiser le mot de passe") +
      emailParagraph(
        ar
          ? "إذا لم تطلب هذا الإجراء، تجاهل هذا الإيميل — كلمة المرور لن تتغيّر."
          : "Si vous n'avez pas demandé cette action, ignorez ce message — votre mot de passe restera inchangé.",
        true,
      ),
  })
}

export default PasswordResetEmail

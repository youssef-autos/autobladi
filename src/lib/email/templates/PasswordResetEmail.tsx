import * as React from "react"

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from "../layout"

type Props = {
  resetUrl: string
  lang?: "ar" | "fr"
}

export function PasswordResetEmail({ resetUrl, lang = "ar" }: Props) {
  const ar = lang === "ar"
  return (
    <EmailLayout
      lang={lang}
      preview={
        ar ? "إعادة تعيين كلمة المرور" : "Réinitialisation de mot de passe"
      }
    >
      <EmailHeading>
        {ar ? "إعادة تعيين كلمة المرور 🔒" : "Réinitialiser votre mot de passe 🔒"}
      </EmailHeading>
      <EmailParagraph>
        {ar
          ? "تلقّينا طلبك لإعادة تعيين كلمة المرور. اضغط على الزر أدناه لاختيار كلمة مرور جديدة. الرابط صالح لمدة ساعة."
          : "Nous avons reçu votre demande de réinitialisation. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Le lien est valable 1 heure."}
      </EmailParagraph>
      <EmailButton href={resetUrl}>
        {ar ? "تعيين كلمة مرور جديدة" : "Réinitialiser le mot de passe"}
      </EmailButton>
      <EmailParagraph muted>
        {ar
          ? "إذا لم تطلب هذا الإجراء، تجاهل هذا الإيميل — كلمة المرور لن تتغيّر."
          : "Si vous n'avez pas demandé cette action, ignorez ce message — votre mot de passe restera inchangé."}
      </EmailParagraph>
    </EmailLayout>
  )
}

export default PasswordResetEmail

import * as React from "react"

import {
  EmailButton,
  EmailGoldBox,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from "../layout"

type Props = {
  name: string
  showroomUrl: string
  lang?: "ar" | "fr"
}

export function VerificationApprovedEmail({
  name,
  showroomUrl,
  lang = "ar",
}: Props) {
  const ar = lang === "ar"
  return (
    <EmailLayout
      lang={lang}
      preview={
        ar
          ? "تم توثيق حسابك ✓"
          : "Votre compte est vérifié ✓"
      }
    >
      <EmailHeading>
        {ar ? `${name}، حسابك موثّق الآن ✓` : `${name}, votre compte est vérifié ✓`}
      </EmailHeading>
      <EmailParagraph>
        {ar
          ? "تم التحقّق من وثائقك بنجاح. شارة \"موثّق\" تظهر الآن على صفحة معرضك وعلى كل إعلاناتك — مما يُعزّز ثقة المشترين."
          : "Vos documents ont été vérifiés. Le badge \"Vérifié\" apparaît désormais sur votre concession et toutes vos annonces — un vrai gage de confiance."}
      </EmailParagraph>
      <EmailButton href={showroomUrl}>
        {ar ? "إدارة المعرض" : "Gérer ma concession"}
      </EmailButton>
      <EmailGoldBox>
        {ar
          ? "🏆 المعارض الموثّقة تحصل على 3x مشاهدات أكثر و 2x تواصل من المشترين."
          : "🏆 Les concessions vérifiées reçoivent 3x plus de vues et 2x plus de contacts."}
      </EmailGoldBox>
    </EmailLayout>
  )
}

export default VerificationApprovedEmail

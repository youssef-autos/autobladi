import * as React from "react"

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from "../layout"

type Props = {
  name: string
  ctaUrl: string
  lang?: "ar" | "fr"
}

export function WelcomeEmail({ name, ctaUrl, lang = "ar" }: Props) {
  const ar = lang === "ar"
  return (
    <EmailLayout
      lang={lang}
      preview={
        ar
          ? `مرحباً ${name}، أهلاً بك في autobladi.ma`
          : `Bienvenue ${name} sur autobladi.ma`
      }
    >
      <EmailHeading>
        {ar ? `مرحباً ${name} 👋` : `Bienvenue ${name} 👋`}
      </EmailHeading>
      <EmailParagraph>
        {ar
          ? "نسعد بانضمامك إلى autobladi.ma، السوق المغربي الأول للسيارات. حسابك جاهز الآن — ابدأ بنشر إعلانك الأول أو تصفّح آلاف السيارات."
          : "Heureux de vous accueillir sur autobladi.ma, le 1er marché auto au Maroc. Votre compte est prêt — publiez votre première annonce ou parcourez des milliers de voitures."}
      </EmailParagraph>
      <EmailButton href={ctaUrl}>
        {ar ? "ابدأ الآن" : "Commencer"}
      </EmailButton>
      <EmailParagraph muted>
        {ar
          ? "نصيحة: أكمل ملفك الشخصي وأضف رقم هاتفك لتظهر مصداقيتك أمام المشترين."
          : "Astuce : complétez votre profil et ajoutez votre numéro pour rassurer les acheteurs."}
      </EmailParagraph>
    </EmailLayout>
  )
}

export default WelcomeEmail

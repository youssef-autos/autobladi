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
  planName: string
  endsAt: string
  showroomUrl: string
  lang?: "ar" | "fr"
}

export function SubscriptionApprovedEmail({
  name,
  planName,
  endsAt,
  showroomUrl,
  lang = "ar",
}: Props) {
  const ar = lang === "ar"
  return (
    <EmailLayout
      lang={lang}
      preview={
        ar
          ? `🎉 تم تفعيل اشتراك ${planName}`
          : `🎉 Abonnement ${planName} activé`
      }
    >
      <EmailHeading>
        {ar ? `🎉 أهلاً بك في autobladi Pro، ${name}` : `🎉 Bienvenue dans autobladi Pro, ${name}`}
      </EmailHeading>
      <EmailParagraph>
        {ar
          ? `تم تفعيل اشتراكك في باقة "${planName}" بنجاح. يمتدّ اشتراكك إلى ${endsAt}.`
          : `Votre abonnement "${planName}" est activé. Il court jusqu'au ${endsAt}.`}
      </EmailParagraph>
      <EmailParagraph>
        {ar
          ? "نُنشئ لك صفحة معرض مخصّصة تلقائياً. ابدأ بإضافة لوغو، صور، وصف، وساعات العمل."
          : "Nous créons automatiquement votre page concession. Commencez par ajouter logo, photos, description et horaires."}
      </EmailParagraph>
      <EmailButton href={showroomUrl}>
        {ar ? "إعداد المعرض" : "Configurer la concession"}
      </EmailButton>
      <EmailGoldBox>
        {ar
          ? "💎 ميزات Pro: إعلانات بلا حدود، إحصائيات متقدّمة، شارة Pro مميّزة."
          : "💎 Avantages Pro : annonces illimitées, stats avancées, badge Pro distinctif."}
      </EmailGoldBox>
    </EmailLayout>
  )
}

export default SubscriptionApprovedEmail

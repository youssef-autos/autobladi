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
  daysLeft: number
  renewUrl: string
  lang?: "ar" | "fr"
}

export function SubscriptionExpiringEmail({
  name,
  planName,
  endsAt,
  daysLeft,
  renewUrl,
  lang = "ar",
}: Props) {
  const ar = lang === "ar"
  return (
    <EmailLayout
      lang={lang}
      preview={
        ar
          ? `ينتهي اشتراكك خلال ${daysLeft} أيام`
          : `Votre abonnement expire dans ${daysLeft} jours`
      }
    >
      <EmailHeading>
        {ar ? `${name}، اشتراكك ينتهي قريباً` : `${name}, votre abonnement expire bientôt`}
      </EmailHeading>
      <EmailParagraph>
        {ar
          ? `اشتراكك في باقة "${planName}" ينتهي بتاريخ ${endsAt} (${daysLeft} أيام متبقية). جدّد الآن لتفادي توقّف معرضك وحذف ميزات Pro.`
          : `Votre abonnement "${planName}" expire le ${endsAt} (${daysLeft} jours restants). Renouvelez maintenant pour éviter la suspension de votre concession.`}
      </EmailParagraph>
      <EmailButton href={renewUrl}>
        {ar ? "جدّد الآن" : "Renouveler maintenant"}
      </EmailButton>
      <EmailGoldBox>
        {ar
          ? "⚠️ بعد الانتهاء سيُحوَّل حسابك إلى مجاني وستختفي صفحة معرضك من القائمة العامة."
          : "⚠️ À l'expiration, votre compte repassera en gratuit et votre concession sera masquée du listing public."}
      </EmailGoldBox>
    </EmailLayout>
  )
}

export default SubscriptionExpiringEmail

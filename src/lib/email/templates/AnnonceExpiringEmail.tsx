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
  annonceTitle: string
  daysLeft: number
  renewUrl: string
  lang?: "ar" | "fr"
}

export function AnnonceExpiringEmail({
  name,
  annonceTitle,
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
          ? `إعلانك "${annonceTitle}" ينتهي خلال ${daysLeft} أيام`
          : `L'annonce "${annonceTitle}" expire dans ${daysLeft} jours`
      }
    >
      <EmailHeading>
        {ar ? `${name}، إعلانك ينتهي قريباً ⏰` : `${name}, votre annonce expire bientôt ⏰`}
      </EmailHeading>
      <EmailParagraph>
        {ar
          ? `إعلانك "${annonceTitle}" سينتهي خلال ${daysLeft} أيام. جدّد الآن للحفاظ على ظهوره في نتائج البحث.`
          : `L'annonce "${annonceTitle}" expire dans ${daysLeft} jours. Renouvelez-la maintenant pour rester visible dans les recherches.`}
      </EmailParagraph>
      <EmailButton href={renewUrl}>
        {ar ? "جدّد الإعلان" : "Renouveler l'annonce"}
      </EmailButton>
      <EmailGoldBox>
        {ar
          ? "💡 إن كنت قد بعت السيارة، يمكنك تحديدها كـ \"مباع\" بدلاً من تركها تنتهي."
          : "💡 Si la voiture est vendue, marquez l'annonce comme \"vendue\" au lieu de la laisser expirer."}
      </EmailGoldBox>
    </EmailLayout>
  )
}

export default AnnonceExpiringEmail

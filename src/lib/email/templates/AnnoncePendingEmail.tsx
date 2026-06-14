import * as React from "react"

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from "../layout"

type Props = {
  name: string
  annonceTitle: string
  dashboardUrl: string
  lang?: "ar" | "fr"
}

export function AnnoncePendingEmail({
  name,
  annonceTitle,
  dashboardUrl,
  lang = "ar",
}: Props) {
  const ar = lang === "ar"
  return (
    <EmailLayout
      lang={lang}
      preview={
        ar
          ? `إعلانك "${annonceTitle}" قيد المراجعة`
          : `Votre annonce "${annonceTitle}" est en cours de revue`
      }
    >
      <EmailHeading>
        {ar ? `شكراً ${name} 🙌` : `Merci ${name} 🙌`}
      </EmailHeading>
      <EmailParagraph>
        {ar
          ? `استلمنا إعلانك "${annonceTitle}". سيراجعه فريقنا خلال 24 ساعة وسنُعلمك بمجرد نشره.`
          : `Nous avons reçu votre annonce "${annonceTitle}". Notre équipe la passera en revue sous 24h et nous vous préviendrons une fois publiée.`}
      </EmailParagraph>
      <EmailButton href={dashboardUrl}>
        {ar ? "تابع حالة إعلانك" : "Suivre l'état de l'annonce"}
      </EmailButton>
      <EmailParagraph muted>
        {ar
          ? "لتسريع المراجعة، تأكّد أن الصور واضحة وأن العنوان والوصف يتطابقان مع السيارة."
          : "Pour accélérer la revue, assurez-vous que les photos sont nettes et que le titre/description correspondent au véhicule."}
      </EmailParagraph>
    </EmailLayout>
  )
}

export default AnnoncePendingEmail

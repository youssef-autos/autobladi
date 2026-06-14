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
  annonceUrl: string
  lang?: "ar" | "fr"
}

export function AnnonceApprovedEmail({
  name,
  annonceTitle,
  annonceUrl,
  lang = "ar",
}: Props) {
  const ar = lang === "ar"
  return (
    <EmailLayout
      lang={lang}
      preview={
        ar
          ? `تم نشر إعلانك: ${annonceTitle}`
          : `Votre annonce est publiée : ${annonceTitle}`
      }
    >
      <EmailHeading>
        {ar ? `تهانينا ${name} 🎉` : `Félicitations ${name} 🎉`}
      </EmailHeading>
      <EmailParagraph>
        {ar
          ? `تم نشر إعلانك "${annonceTitle}" بنجاح وأصبح مرئياً لكل زوار autobladi.ma.`
          : `Votre annonce "${annonceTitle}" est désormais visible par tous les visiteurs d'autobladi.ma.`}
      </EmailParagraph>
      <EmailButton href={annonceUrl}>
        {ar ? "عرض الإعلان" : "Voir l'annonce"}
      </EmailButton>
      <EmailGoldBox>
        {ar
          ? "💡 نصيحة: شارك رابط إعلانك على واتساب وفيسبوك لزيادة المشاهدات."
          : "💡 Astuce : partagez votre annonce sur WhatsApp et Facebook pour plus de vues."}
      </EmailGoldBox>
    </EmailLayout>
  )
}

export default AnnonceApprovedEmail

import * as React from "react"

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from "../layout"
import { COLORS } from "../layout"
import { Section, Text } from "@react-email/components"

type Props = {
  name: string
  annonceTitle: string
  reason: string
  editUrl: string
  lang?: "ar" | "fr"
}

export function AnnonceRejectedEmail({
  name,
  annonceTitle,
  reason,
  editUrl,
  lang = "ar",
}: Props) {
  const ar = lang === "ar"
  return (
    <EmailLayout
      lang={lang}
      preview={
        ar
          ? `إعلانك "${annonceTitle}" بحاجة لتعديل`
          : `Votre annonce "${annonceTitle}" nécessite des modifications`
      }
    >
      <EmailHeading>
        {ar ? `${name}، إعلانك يحتاج لتعديل` : `${name}, votre annonce a besoin d'ajustements`}
      </EmailHeading>
      <EmailParagraph>
        {ar
          ? `راجعنا إعلانك "${annonceTitle}" ووجدنا أنه يحتاج لبعض التعديلات قبل النشر.`
          : `Nous avons revu votre annonce "${annonceTitle}" et elle nécessite quelques modifications avant publication.`}
      </EmailParagraph>
      <Section
        style={{
          backgroundColor: "#fef2f2",
          border: `1px solid ${COLORS.red}33`,
          borderRadius: "10px",
          padding: "16px",
          margin: "12px 0 20px 0",
        }}
      >
        <Text
          style={{
            margin: "0 0 6px 0",
            fontSize: "12px",
            fontWeight: 600,
            color: COLORS.red,
            textTransform: "uppercase" as const,
          }}
        >
          {ar ? "سبب الرفض" : "Motif"}
        </Text>
        <Text style={{ margin: 0, fontSize: "14px", color: COLORS.dark }}>
          {reason}
        </Text>
      </Section>
      <EmailButton href={editUrl}>
        {ar ? "تعديل الإعلان" : "Modifier l'annonce"}
      </EmailButton>
      <EmailParagraph muted>
        {ar
          ? "بعد التعديل سيُعاد الإعلان لقائمة المراجعة تلقائياً."
          : "Une fois modifiée, l'annonce repassera automatiquement en revue."}
      </EmailParagraph>
    </EmailLayout>
  )
}

export default AnnonceRejectedEmail

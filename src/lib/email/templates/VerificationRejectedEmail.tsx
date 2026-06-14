import * as React from "react"
import { Section, Text } from "@react-email/components"

import {
  COLORS,
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from "../layout"

type Props = {
  name: string
  reason: string
  retryUrl: string
  lang?: "ar" | "fr"
}

export function VerificationRejectedEmail({
  name,
  reason,
  retryUrl,
  lang = "ar",
}: Props) {
  const ar = lang === "ar"
  return (
    <EmailLayout
      lang={lang}
      preview={
        ar
          ? "طلب التوثيق يحتاج لمعلومات إضافية"
          : "La vérification nécessite des informations supplémentaires"
      }
    >
      <EmailHeading>
        {ar ? `${name}، طلب التوثيق` : `${name}, votre demande de vérification`}
      </EmailHeading>
      <EmailParagraph>
        {ar
          ? "للأسف، لم نتمكّن من اعتماد طلب التوثيق الخاص بك. يمكنك إعادة الإرسال بعد تصحيح الملاحظات أدناه."
          : "Nous n'avons pas pu valider votre demande de vérification. Vous pouvez la renvoyer après correction."}
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
          {ar ? "الملاحظات" : "Remarques"}
        </Text>
        <Text style={{ margin: 0, fontSize: "14px", color: COLORS.dark }}>
          {reason}
        </Text>
      </Section>
      <EmailButton href={retryUrl}>
        {ar ? "إعادة إرسال الطلب" : "Renvoyer la demande"}
      </EmailButton>
    </EmailLayout>
  )
}

export default VerificationRejectedEmail

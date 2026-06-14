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
  planName: string
  reason: string
  retryUrl: string
  lang?: "ar" | "fr"
}

export function SubscriptionRejectedEmail({
  name,
  planName,
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
          ? `طلب اشتراك ${planName} - يحتاج لتوضيح`
          : `Demande d'abonnement ${planName} - clarification`
      }
    >
      <EmailHeading>
        {ar ? `${name}، طلب الاشتراك` : `${name}, votre demande d'abonnement`}
      </EmailHeading>
      <EmailParagraph>
        {ar
          ? `لم نتمكّن من تأكيد تحويلك البنكي لباقة "${planName}". يرجى مراجعة الملاحظات وإعادة الإرسال مع الإثباتات الصحيحة.`
          : `Nous n'avons pas pu valider votre virement pour l'abonnement "${planName}". Vérifiez les remarques et soumettez à nouveau avec les justificatifs corrects.`}
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
          {ar ? "السبب" : "Motif"}
        </Text>
        <Text style={{ margin: 0, fontSize: "14px", color: COLORS.dark }}>
          {reason}
        </Text>
      </Section>
      <EmailButton href={retryUrl}>
        {ar ? "إعادة الطلب" : "Soumettre à nouveau"}
      </EmailButton>
    </EmailLayout>
  )
}

export default SubscriptionRejectedEmail

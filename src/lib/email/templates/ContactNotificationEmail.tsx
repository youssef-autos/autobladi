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
  fromName: string
  fromEmail: string
  fromPhone?: string | null
  subject: string
  message: string
  adminUrl: string
}

/**
 * Sent to admins (lang fixed to FR for ops). When the public submits the
 * contact form (or the /publicite inquiry) we forward the essentials so an
 * admin can react without leaving their inbox.
 */
export function ContactNotificationEmail({
  fromName,
  fromEmail,
  fromPhone,
  subject,
  message,
  adminUrl,
}: Props) {
  return (
    <EmailLayout
      lang="fr"
      preview={`Nouveau message de ${fromName} — ${subject}`}
    >
      <EmailHeading>📨 Nouveau message</EmailHeading>
      <EmailParagraph>
        Un nouveau message a été reçu via le formulaire de contact.
      </EmailParagraph>

      <Section
        style={{
          backgroundColor: COLORS.sand,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "10px",
          padding: "16px",
          margin: "12px 0 20px 0",
        }}
      >
        <Row label="Expéditeur" value={fromName} />
        <Row label="E-mail" value={fromEmail} />
        {fromPhone && <Row label="Téléphone" value={fromPhone} />}
        <Row label="Sujet" value={subject} />
      </Section>

      <Text
        style={{
          margin: "0 0 8px 0",
          fontSize: "13px",
          fontWeight: 600,
          color: COLORS.muted,
          textTransform: "uppercase" as const,
        }}
      >
        Message
      </Text>
      <Section
        style={{
          backgroundColor: "#fafafa",
          border: `1px solid ${COLORS.border}`,
          borderRadius: "10px",
          padding: "16px",
          margin: "0 0 20px 0",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: "14px",
            lineHeight: 1.6,
            color: COLORS.text,
            whiteSpace: "pre-wrap" as const,
          }}
        >
          {message}
        </Text>
      </Section>

      <EmailButton href={adminUrl}>Ouvrir dans l&apos;admin</EmailButton>
    </EmailLayout>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text
      style={{
        margin: "4px 0",
        fontSize: "14px",
        color: COLORS.text,
      }}
    >
      <strong style={{ color: COLORS.dark }}>{label}: </strong>
      {value}
    </Text>
  )
}

export default ContactNotificationEmail

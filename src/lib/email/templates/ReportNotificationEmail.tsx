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
  reporterName: string
  annonceTitle: string
  reason: string
  description?: string | null
  adminUrl: string
}

export function ReportNotificationEmail({
  reporterName,
  annonceTitle,
  reason,
  description,
  adminUrl,
}: Props) {
  return (
    <EmailLayout
      lang="fr"
      preview={`Nouveau signalement: ${annonceTitle}`}
    >
      <EmailHeading>🚨 Nouveau signalement</EmailHeading>
      <EmailParagraph>
        Un utilisateur a signalé une annonce sur le site.
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
        <Row label="Annonce" value={annonceTitle} />
        <Row label="Signalé par" value={reporterName} />
        <Row label="Motif" value={reason} />
      </Section>

      {description && (
        <>
          <Text
            style={{
              margin: "0 0 8px 0",
              fontSize: "13px",
              fontWeight: 600,
              color: COLORS.muted,
              textTransform: "uppercase" as const,
            }}
          >
            Détails
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
              {description}
            </Text>
          </Section>
        </>
      )}

      <EmailButton href={adminUrl}>Examiner le signalement</EmailButton>
    </EmailLayout>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ margin: "4px 0", fontSize: "14px", color: COLORS.text }}>
      <strong style={{ color: COLORS.dark }}>{label}: </strong>
      {value}
    </Text>
  )
}

export default ReportNotificationEmail

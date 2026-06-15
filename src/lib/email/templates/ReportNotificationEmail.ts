import { emailButton, emailHeading, emailInfoBox, emailLayout, emailMessageBox, emailParagraph, emailSectionLabel } from "../layout"

type Props = {
  reporterName: string
  annonceTitle: string
  reason: string
  description?: string | null
  adminUrl: string
}

export function ReportNotificationEmail({ reporterName, annonceTitle, reason, description, adminUrl }: Props): string {
  return emailLayout({
    lang: "fr",
    preview: `Nouveau signalement: ${annonceTitle}`,
    body:
      emailHeading("🚨 Nouveau signalement") +
      emailParagraph("Un utilisateur a signalé une annonce sur le site.") +
      emailInfoBox([
        { label: "Annonce", value: annonceTitle },
        { label: "Signalé par", value: reporterName },
        { label: "Motif", value: reason },
      ]) +
      (description ? emailSectionLabel("Détails") + emailMessageBox(description) : "") +
      emailButton(adminUrl, "Examiner le signalement"),
  })
}

export default ReportNotificationEmail

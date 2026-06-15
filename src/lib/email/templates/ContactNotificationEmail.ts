import { emailButton, emailHeading, emailInfoBox, emailLayout, emailMessageBox, emailParagraph, emailSectionLabel } from "../layout"

type Props = {
  fromName: string
  fromEmail: string
  fromPhone?: string | null
  subject: string
  message: string
  adminUrl: string
}

export function ContactNotificationEmail({ fromName, fromEmail, fromPhone, subject, message, adminUrl }: Props): string {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Expéditeur", value: fromName },
    { label: "E-mail", value: fromEmail },
    ...(fromPhone ? [{ label: "Téléphone", value: fromPhone }] : []),
    { label: "Sujet", value: subject },
  ]
  return emailLayout({
    lang: "fr",
    preview: `Nouveau message de ${fromName} — ${subject}`,
    body:
      emailHeading("📨 Nouveau message") +
      emailParagraph("Un nouveau message a été reçu via le formulaire de contact.") +
      emailInfoBox(rows) +
      emailSectionLabel("Message") +
      emailMessageBox(message) +
      emailButton(adminUrl, "Ouvrir dans l'admin"),
  })
}

export default ContactNotificationEmail

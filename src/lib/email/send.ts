import "server-only"

import { getResend, isResendConfigured } from "./client"
import { getEmailSettings, type EmailType } from "./settings"

import { AnnonceApprovedEmail } from "./templates/AnnonceApprovedEmail"
import { AnnonceExpiringEmail } from "./templates/AnnonceExpiringEmail"
import { AnnoncePendingEmail } from "./templates/AnnoncePendingEmail"
import { AnnonceRejectedEmail } from "./templates/AnnonceRejectedEmail"
import { ContactNotificationEmail } from "./templates/ContactNotificationEmail"
import { NewsletterEmail, type NewsletterItem } from "./templates/NewsletterEmail"
import { PasswordResetEmail } from "./templates/PasswordResetEmail"
import { ReportNotificationEmail } from "./templates/ReportNotificationEmail"
import { VerificationApprovedEmail } from "./templates/VerificationApprovedEmail"
import { VerificationRejectedEmail } from "./templates/VerificationRejectedEmail"
import { WelcomeEmail } from "./templates/WelcomeEmail"

export type SendResult =
  | { ok: true; skipped?: "disabled" | "no_key" | "no_to" }
  | { ok: false; error: string }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

async function sendEmail({
  type,
  to,
  subject,
  html,
  alwaysSend = false,
}: {
  type: EmailType
  to: string | string[] | null | undefined
  subject: string
  html: string
  /** Skip the admin on/off toggle — for security-critical mails (password reset). */
  alwaysSend?: boolean
}): Promise<SendResult> {
  if (!to || (Array.isArray(to) && to.length === 0)) {
    return { ok: true, skipped: "no_to" }
  }

  const settings = await getEmailSettings()
  if (!alwaysSend && !settings.enabled[type]) {
    return { ok: true, skipped: "disabled" }
  }

  const resend = await getResend()
  if (!resend) {
    console.warn(`[email] Resend key not set — skipping ${type}`)
    return { ok: true, skipped: "no_key" }
  }
  try {
    const { error } = await resend.emails.send({
      from: settings.from,
      to,
      replyTo: settings.replyTo,
      subject,
      html,
    })
    if (error) {
      console.error(`[email] ${type} failed`, error)
      return { ok: false, error: error.message ?? "send_failed" }
    }
    return { ok: true }
  } catch (e) {
    console.error(`[email] ${type} threw`, e)
    return { ok: false, error: (e as Error).message ?? "send_failed" }
  }
}

// ---------------------------------------------------------------------------
// Public senders
// ---------------------------------------------------------------------------

export function sendWelcomeEmail(args: { to: string; name: string; lang?: "ar" | "fr" }) {
  const lang = args.lang ?? "ar"
  return sendEmail({
    type: "welcome",
    to: args.to,
    subject: lang === "ar" ? "مرحباً بك في autobladi.ma" : "Bienvenue sur autobladi.ma",
    html: WelcomeEmail({ name: args.name, ctaUrl: `${SITE_URL}/${lang}/dashboard`, lang }),
  })
}

export function sendAnnoncePendingEmail(args: { to: string; name: string; annonceTitle: string; lang?: "ar" | "fr" }) {
  const lang = args.lang ?? "ar"
  return sendEmail({
    type: "annonce_pending",
    to: args.to,
    subject: lang === "ar" ? "إعلانك قيد المراجعة" : "Votre annonce est en cours de revue",
    html: AnnoncePendingEmail({ name: args.name, annonceTitle: args.annonceTitle, dashboardUrl: `${SITE_URL}/${lang}/dashboard/annonces`, lang }),
  })
}

export function sendAnnonceApprovedEmail(args: { to: string; name: string; annonceTitle: string; annonceSlug: string; lang?: "ar" | "fr" }) {
  const lang = args.lang ?? "ar"
  return sendEmail({
    type: "annonce_approved",
    to: args.to,
    subject: lang === "ar" ? "تم نشر إعلانك ✓" : "Votre annonce est publiée ✓",
    html: AnnonceApprovedEmail({ name: args.name, annonceTitle: args.annonceTitle, annonceUrl: `${SITE_URL}/${lang}/annonces/${args.annonceSlug}`, lang }),
  })
}

export function sendAnnonceRejectedEmail(args: { to: string; name: string; annonceTitle: string; annonceId: string; reason: string; lang?: "ar" | "fr" }) {
  const lang = args.lang ?? "ar"
  return sendEmail({
    type: "annonce_rejected",
    to: args.to,
    subject: lang === "ar" ? "إعلانك بحاجة لتعديل" : "Votre annonce nécessite des modifications",
    html: AnnonceRejectedEmail({ name: args.name, annonceTitle: args.annonceTitle, reason: args.reason, editUrl: `${SITE_URL}/${lang}/dashboard/modifier/${args.annonceId}`, lang }),
  })
}

export function sendVerificationApprovedEmail(args: { to: string; name: string; lang?: "ar" | "fr" }) {
  const lang = args.lang ?? "ar"
  return sendEmail({
    type: "verification_approved",
    to: args.to,
    subject: lang === "ar" ? "تم توثيق حسابك ✓" : "Votre compte est vérifié ✓",
    html: VerificationApprovedEmail({ name: args.name, showroomUrl: `${SITE_URL}/${lang}/dashboard/showroom`, lang }),
  })
}

export function sendVerificationRejectedEmail(args: { to: string; name: string; reason: string; lang?: "ar" | "fr" }) {
  const lang = args.lang ?? "ar"
  return sendEmail({
    type: "verification_rejected",
    to: args.to,
    subject: lang === "ar" ? "طلب التوثيق — يحتاج لمعلومات إضافية" : "Vérification — informations supplémentaires requises",
    html: VerificationRejectedEmail({ name: args.name, reason: args.reason, retryUrl: `${SITE_URL}/${lang}/dashboard/verification`, lang }),
  })
}

export function sendAnnonceExpiringEmail(args: { to: string; name: string; annonceTitle: string; annonceId: string; daysLeft: number; lang?: "ar" | "fr" }) {
  const lang = args.lang ?? "ar"
  return sendEmail({
    type: "annonce_expiring",
    to: args.to,
    subject: lang === "ar" ? "إعلانك ينتهي قريباً — جدّده الآن" : "Votre annonce expire bientôt — renouvelez-la",
    html: AnnonceExpiringEmail({ name: args.name, annonceTitle: args.annonceTitle, daysLeft: args.daysLeft, renewUrl: `${SITE_URL}/${lang}/dashboard/modifier/${args.annonceId}`, lang }),
  })
}

export function sendPasswordResetEmail(args: { to: string; resetUrl: string; lang?: "ar" | "fr" }) {
  const lang = args.lang ?? "ar"
  return sendEmail({
    type: "welcome",
    alwaysSend: true, // security-critical — never gated behind another toggle
    to: args.to,
    subject: lang === "ar" ? "إعادة تعيين كلمة المرور" : "Réinitialisation du mot de passe",
    html: PasswordResetEmail({ resetUrl: args.resetUrl, lang }),
  })
}

export async function sendContactNotificationEmail(args: { fromName: string; fromEmail: string; fromPhone?: string | null; subject: string; message: string }) {
  const settings = await getEmailSettings()
  return sendEmail({
    type: "contact_notification",
    to: settings.adminEmail || undefined,
    subject: `📨 ${args.subject} — ${args.fromName}`,
    html: ContactNotificationEmail({ fromName: args.fromName, fromEmail: args.fromEmail, fromPhone: args.fromPhone ?? null, subject: args.subject, message: args.message, adminUrl: `${SITE_URL}/ar/admin/communication/contact` }),
  })
}

export async function sendReportNotificationEmail(args: { reporterName: string; annonceTitle: string; reason: string; description?: string | null }) {
  const settings = await getEmailSettings()
  return sendEmail({
    type: "report_notification",
    to: settings.adminEmail || undefined,
    subject: `🚨 Nouveau signalement: ${args.annonceTitle}`,
    html: ReportNotificationEmail({ reporterName: args.reporterName, annonceTitle: args.annonceTitle, reason: args.reason, description: args.description ?? null, adminUrl: `${SITE_URL}/ar/admin/annonces/reports` }),
  })
}

export function sendNewsletterEmail(args: { to: string | string[]; preheader: string; introHeading: string; introText: string; items: NewsletterItem[]; unsubscribeUrl: string; lang?: "ar" | "fr" }) {
  const lang = args.lang ?? "ar"
  return sendEmail({
    type: "newsletter",
    to: args.to,
    subject: lang === "ar" ? "نشرة autobladi الأسبوعية" : "Newsletter autobladi — Hebdo",
    html: NewsletterEmail({ preheader: args.preheader, introHeading: args.introHeading, introText: args.introText, items: args.items, unsubscribeUrl: args.unsubscribeUrl, lang }),
  })
}

export async function sendTestEmail(to: string): Promise<SendResult> {
  if (!(await isResendConfigured())) {
    return { ok: false, error: "Resend key not set" }
  }
  return sendWelcomeEmail({ to, name: "Admin Test", lang: "ar" })
}

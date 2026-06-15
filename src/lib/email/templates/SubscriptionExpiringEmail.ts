import { emailButton, emailGoldBox, emailHeading, emailLayout, emailParagraph } from "../layout"

type Props = { name: string; planName: string; endsAt: string; daysLeft: number; renewUrl: string; lang?: "ar" | "fr" }

export function SubscriptionExpiringEmail({ name, planName, endsAt, daysLeft, renewUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? `ينتهي اشتراكك خلال ${daysLeft} أيام` : `Votre abonnement expire dans ${daysLeft} jours`,
    body:
      emailHeading(ar ? `${name}، اشتراكك ينتهي قريباً` : `${name}, votre abonnement expire bientôt`) +
      emailParagraph(
        ar
          ? `اشتراكك في باقة "${planName}" ينتهي بتاريخ ${endsAt} (${daysLeft} أيام متبقية). جدّد الآن لتفادي توقّف معرضك وحذف ميزات Pro.`
          : `Votre abonnement "${planName}" expire le ${endsAt} (${daysLeft} jours restants). Renouvelez maintenant pour éviter la suspension de votre concession.`,
      ) +
      emailButton(renewUrl, ar ? "جدّد الآن" : "Renouveler maintenant") +
      emailGoldBox(
        ar
          ? "⚠️ بعد الانتهاء سيُحوَّل حسابك إلى مجاني وستختفي صفحة معرضك من القائمة العامة."
          : "⚠️ À l'expiration, votre compte repassera en gratuit et votre concession sera masquée du listing public.",
      ),
  })
}

export default SubscriptionExpiringEmail

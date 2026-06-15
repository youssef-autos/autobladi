import { emailButton, emailGoldBox, emailHeading, emailLayout, emailParagraph } from "../layout"

type Props = { name: string; planName: string; daysLeft: number; renewUrl: string; lang?: "ar" | "fr" }

export function SubscriptionGraceEmail({ name, planName, daysLeft, renewUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  const suspended = daysLeft <= 0

  const preview = suspended
    ? ar ? "تم إيقاف خدمات حسابك المحترف" : "Vos services professionnels ont été suspendus"
    : ar ? `تبقّى ${daysLeft} يوم قبل إيقاف خدماتك` : `Plus que ${daysLeft} jours avant la suspension`

  const heading = suspended
    ? ar ? `${name}، تم إيقاف خدماتك المحترفة` : `${name}, vos services professionnels sont suspendus`
    : ar ? `${name}، انتهى اشتراكك` : `${name}, votre abonnement a expiré`

  const bodyText = suspended
    ? ar
      ? `انتهت مهلة السماح بعد انتهاء اشتراكك في باقة "${planName}"، وتم إيقاف خدمات حسابك المحترف: عاد حسابك إلى مجاني واختفى معرضك من القائمة العامة. جدّد اشتراكك لإعادة تفعيل كل المزايا فوراً.`
      : `Le délai de grâce après l'expiration de votre abonnement "${planName}" est écoulé. Vos services professionnels sont suspendus : votre compte est repassé en gratuit et votre concession est masquée du listing public. Renouvelez pour tout réactiver immédiatement.`
    : ar
      ? `انتهى اشتراكك في باقة "${planName}". أمامك ${daysLeft} يوم فقط قبل إيقاف خدمات حسابك المحترف (المعرض، مزايا Pro). جدّد الآن لتفادي التوقّف.`
      : `Votre abonnement "${planName}" a expiré. Il vous reste seulement ${daysLeft} jours avant la suspension de vos services pro (concession, avantages Pro). Renouvelez maintenant pour éviter l'interruption.`

  const goldNote = !suspended
    ? emailGoldBox(
        ar
          ? `⏳ ستتلقّى هذا التذكير يومياً حتى تجدّد أو تنتهي المهلة (${daysLeft} يوم متبقٍّ).`
          : `⏳ Vous recevrez ce rappel chaque jour jusqu'au renouvellement ou la fin du délai (${daysLeft} jours restants).`,
      )
    : ""

  return emailLayout({
    lang,
    preview,
    body:
      emailHeading(heading) +
      emailParagraph(bodyText) +
      emailButton(renewUrl, ar ? "جدّد الآن" : "Renouveler maintenant") +
      goldNote,
  })
}

export default SubscriptionGraceEmail

import * as React from "react"

import {
  EmailButton,
  EmailGoldBox,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from "../layout"

type Props = {
  name: string
  planName: string
  /** Days left before suspension. 0 = already suspended. */
  daysLeft: number
  renewUrl: string
  lang?: "ar" | "fr"
}

/**
 * Sent during the post-expiry grace window (daily). When `daysLeft` reaches 0
 * the same template doubles as the suspension notice.
 */
export function SubscriptionGraceEmail({
  name,
  planName,
  daysLeft,
  renewUrl,
  lang = "ar",
}: Props) {
  const ar = lang === "ar"
  const suspended = daysLeft <= 0

  const preview = suspended
    ? ar
      ? "تم إيقاف خدمات حسابك المحترف"
      : "Vos services professionnels ont été suspendus"
    : ar
      ? `تبقّى ${daysLeft} يوم قبل إيقاف خدماتك`
      : `Plus que ${daysLeft} jours avant la suspension`

  return (
    <EmailLayout lang={lang} preview={preview}>
      <EmailHeading>
        {suspended
          ? ar
            ? `${name}، تم إيقاف خدماتك المحترفة`
            : `${name}, vos services professionnels sont suspendus`
          : ar
            ? `${name}، انتهى اشتراكك`
            : `${name}, votre abonnement a expiré`}
      </EmailHeading>

      {suspended ? (
        <EmailParagraph>
          {ar
            ? `انتهت مهلة السماح بعد انتهاء اشتراكك في باقة "${planName}"، وتم إيقاف خدمات حسابك المحترف: عاد حسابك إلى مجاني واختفى معرضك من القائمة العامة. جدّد اشتراكك لإعادة تفعيل كل المزايا فوراً.`
            : `Le délai de grâce après l'expiration de votre abonnement "${planName}" est écoulé. Vos services professionnels sont suspendus : votre compte est repassé en gratuit et votre concession est masquée du listing public. Renouvelez pour tout réactiver immédiatement.`}
        </EmailParagraph>
      ) : (
        <EmailParagraph>
          {ar
            ? `انتهى اشتراكك في باقة "${planName}". أمامك ${daysLeft} يوم فقط قبل إيقاف خدمات حسابك المحترف (المعرض، مزايا Pro). جدّد الآن لتفادي التوقّف.`
            : `Votre abonnement "${planName}" a expiré. Il vous reste seulement ${daysLeft} jours avant la suspension de vos services pro (concession, avantages Pro). Renouvelez maintenant pour éviter l'interruption.`}
        </EmailParagraph>
      )}

      <EmailButton href={renewUrl}>
        {ar ? "جدّد الآن" : "Renouveler maintenant"}
      </EmailButton>

      {!suspended && (
        <EmailGoldBox>
          {ar
            ? `⏳ ستتلقّى هذا التذكير يومياً حتى تجدّد أو تنتهي المهلة (${daysLeft} يوم متبقٍّ).`
            : `⏳ Vous recevrez ce rappel chaque jour jusqu'au renouvellement ou la fin du délai (${daysLeft} jours restants).`}
        </EmailGoldBox>
      )}
    </EmailLayout>
  )
}

export default SubscriptionGraceEmail

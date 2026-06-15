import { emailButton, emailGoldBox, emailHeading, emailLayout, emailParagraph } from "../layout"

type Props = { name: string; planName: string; endsAt: string; showroomUrl: string; lang?: "ar" | "fr" }

export function SubscriptionApprovedEmail({ name, planName, endsAt, showroomUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? `🎉 تم تفعيل اشتراك ${planName}` : `🎉 Abonnement ${planName} activé`,
    body:
      emailHeading(ar ? `🎉 أهلاً بك في autobladi Pro، ${name}` : `🎉 Bienvenue dans autobladi Pro, ${name}`) +
      emailParagraph(
        ar
          ? `تم تفعيل اشتراكك في باقة "${planName}" بنجاح. يمتدّ اشتراكك إلى ${endsAt}.`
          : `Votre abonnement "${planName}" est activé. Il court jusqu'au ${endsAt}.`,
      ) +
      emailParagraph(
        ar
          ? "نُنشئ لك صفحة معرض مخصّصة تلقائياً. ابدأ بإضافة لوغو، صور، وصف، وساعات العمل."
          : "Nous créons automatiquement votre page concession. Commencez par ajouter logo, photos, description et horaires.",
      ) +
      emailButton(showroomUrl, ar ? "إعداد المعرض" : "Configurer la concession") +
      emailGoldBox(
        ar
          ? "💎 ميزات Pro: إعلانات بلا حدود، إحصائيات متقدّمة، شارة Pro مميّزة."
          : "💎 Avantages Pro : annonces illimitées, stats avancées, badge Pro distinctif.",
      ),
  })
}

export default SubscriptionApprovedEmail

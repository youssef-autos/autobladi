import { emailButton, emailHeading, emailLayout, emailParagraph } from "../layout"

type Props = { name: string; ctaUrl: string; lang?: "ar" | "fr" }

export function WelcomeEmail({ name, ctaUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? `مرحباً ${name}، أهلاً بك في autobladi.ma` : `Bienvenue ${name} sur autobladi.ma`,
    body:
      emailHeading(ar ? `مرحباً ${name} 👋` : `Bienvenue ${name} 👋`) +
      emailParagraph(
        ar
          ? "نسعد بانضمامك إلى autobladi.ma، السوق المغربي الأول للسيارات. حسابك جاهز الآن — ابدأ بنشر إعلانك الأول أو تصفّح آلاف السيارات."
          : "Heureux de vous accueillir sur autobladi.ma, le 1er marché auto au Maroc. Votre compte est prêt — publiez votre première annonce ou parcourez des milliers de voitures.",
      ) +
      emailButton(ctaUrl, ar ? "ابدأ الآن" : "Commencer") +
      emailParagraph(
        ar
          ? "نصيحة: أكمل ملفك الشخصي وأضف رقم هاتفك لتظهر مصداقيتك أمام المشترين."
          : "Astuce : complétez votre profil et ajoutez votre numéro pour rassurer les acheteurs.",
        true,
      ),
  })
}

export default WelcomeEmail

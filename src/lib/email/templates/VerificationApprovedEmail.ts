import { emailButton, emailGoldBox, emailHeading, emailLayout, emailParagraph } from "../layout"

type Props = { name: string; showroomUrl: string; lang?: "ar" | "fr" }

export function VerificationApprovedEmail({ name, showroomUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? "تم توثيق حسابك ✓" : "Votre compte est vérifié ✓",
    body:
      emailHeading(ar ? `${name}، حسابك موثّق الآن ✓` : `${name}, votre compte est vérifié ✓`) +
      emailParagraph(
        ar
          ? "تم التحقّق من وثائقك بنجاح. شارة \"موثّق\" تظهر الآن على صفحة معرضك وعلى كل إعلاناتك — مما يُعزّز ثقة المشترين."
          : "Vos documents ont été vérifiés. Le badge \"Vérifié\" apparaît désormais sur votre concession et toutes vos annonces — un vrai gage de confiance.",
      ) +
      emailButton(showroomUrl, ar ? "إدارة المعرض" : "Gérer ma concession") +
      emailGoldBox(
        ar
          ? "🏆 المعارض الموثّقة تحصل على 3x مشاهدات أكثر و 2x تواصل من المشترين."
          : "🏆 Les concessions vérifiées reçoivent 3x plus de vues et 2x plus de contacts.",
      ),
  })
}

export default VerificationApprovedEmail

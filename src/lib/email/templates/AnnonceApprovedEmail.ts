import { emailButton, emailGoldBox, emailHeading, emailLayout, emailParagraph } from "../layout"

type Props = { name: string; annonceTitle: string; annonceUrl: string; lang?: "ar" | "fr" }

export function AnnonceApprovedEmail({ name, annonceTitle, annonceUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? `تم نشر إعلانك: ${annonceTitle}` : `Votre annonce est publiée : ${annonceTitle}`,
    body:
      emailHeading(ar ? `تهانينا ${name} 🎉` : `Félicitations ${name} 🎉`) +
      emailParagraph(
        ar
          ? `تم نشر إعلانك "${annonceTitle}" بنجاح وأصبح مرئياً لكل زوار autobladi.ma.`
          : `Votre annonce "${annonceTitle}" est désormais visible par tous les visiteurs d'autobladi.ma.`,
      ) +
      emailButton(annonceUrl, ar ? "عرض الإعلان" : "Voir l'annonce") +
      emailGoldBox(
        ar
          ? "💡 نصيحة: شارك رابط إعلانك على واتساب وفيسبوك لزيادة المشاهدات."
          : "💡 Astuce : partagez votre annonce sur WhatsApp et Facebook pour plus de vues.",
      ),
  })
}

export default AnnonceApprovedEmail

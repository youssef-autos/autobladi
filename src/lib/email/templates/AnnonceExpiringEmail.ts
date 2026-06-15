import { emailButton, emailGoldBox, emailHeading, emailLayout, emailParagraph } from "../layout"

type Props = { name: string; annonceTitle: string; daysLeft: number; renewUrl: string; lang?: "ar" | "fr" }

export function AnnonceExpiringEmail({ name, annonceTitle, daysLeft, renewUrl, lang = "ar" }: Props): string {
  const ar = lang === "ar"
  return emailLayout({
    lang,
    preview: ar ? `إعلانك "${annonceTitle}" ينتهي خلال ${daysLeft} أيام` : `L'annonce "${annonceTitle}" expire dans ${daysLeft} jours`,
    body:
      emailHeading(ar ? `${name}، إعلانك ينتهي قريباً ⏰` : `${name}, votre annonce expire bientôt ⏰`) +
      emailParagraph(
        ar
          ? `إعلانك "${annonceTitle}" سينتهي خلال ${daysLeft} أيام. جدّد الآن للحفاظ على ظهوره في نتائج البحث.`
          : `L'annonce "${annonceTitle}" expire dans ${daysLeft} jours. Renouvelez-la maintenant pour rester visible dans les recherches.`,
      ) +
      emailButton(renewUrl, ar ? "جدّد الإعلان" : "Renouveler l'annonce") +
      emailGoldBox(
        ar
          ? "💡 إن كنت قد بعت السيارة، يمكنك تحديدها كـ \"مباع\" بدلاً من تركها تنتهي."
          : "💡 Si la voiture est vendue, marquez l'annonce comme \"vendue\" au lieu de la laisser expirer.",
      ),
  })
}

export default AnnonceExpiringEmail

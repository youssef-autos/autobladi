/**
 * Single-value vehicle characteristics (stored as a key on the annonce row).
 * Labels live here so the DB stays language-agnostic and the form + detail
 * page read from one source. To add a value: drop one `{ key, ar, fr }` line.
 */

export type VehicleOption = {
  key: string
  ar: string
  fr: string
}

/** Origine du véhicule — stored in annonces.origine */
export const ORIGINES: VehicleOption[] = [
  { key: "ww_maroc", ar: "WW مغربية", fr: "WW au Maroc" },
  { key: "dedouanee", ar: "مُخلَّصة من الديوانة", fr: "Dédouanée" },
  { key: "non_dedouanee", ar: "غير مُخلَّصة بعد", fr: "Pas encore dédouanée" },
]

/** Couleur du véhicule — stored in annonces.color */
export const COLORS: VehicleOption[] = [
  { key: "blanc", ar: "أبيض", fr: "Blanc" },
  { key: "noir", ar: "أسود", fr: "Noir" },
  { key: "gris", ar: "رمادي", fr: "Gris" },
  { key: "argent", ar: "فضي", fr: "Argent" },
  { key: "rouge", ar: "أحمر", fr: "Rouge" },
  { key: "bordeaux", ar: "عنابي", fr: "Bordeaux" },
  { key: "bleu", ar: "أزرق", fr: "Bleu" },
  { key: "bleu_marine", ar: "كحلي", fr: "Bleu marine" },
  { key: "vert", ar: "أخضر", fr: "Vert" },
  { key: "jaune", ar: "أصفر", fr: "Jaune" },
  { key: "orange", ar: "برتقالي", fr: "Orange" },
  { key: "marron", ar: "بني", fr: "Marron" },
  { key: "beige", ar: "بيج", fr: "Beige" },
  { key: "or", ar: "ذهبي", fr: "Or" },
  { key: "violet", ar: "بنفسجي", fr: "Violet" },
  { key: "autre", ar: "أخرى", fr: "Autre" },
]

/** Boîte de vitesses — stored in annonces.transmission (a Postgres enum) */
export const TRANSMISSIONS: VehicleOption[] = [
  { key: "manuelle", ar: "عادي", fr: "Manuelle" },
  { key: "automatique", ar: "أوتوماتيك", fr: "Automatique" },
]

function labelFrom(
  list: VehicleOption[],
  key: string | null | undefined,
  locale: string,
): string | null {
  if (!key) return null
  const found = list.find((o) => o.key === key)
  if (!found) return key // legacy / free value — show as-is
  return locale === "ar" ? found.ar : found.fr
}

export function origineLabel(
  key: string | null | undefined,
  locale: string,
): string | null {
  return labelFrom(ORIGINES, key, locale)
}

export function colorLabel(
  key: string | null | undefined,
  locale: string,
): string | null {
  return labelFrom(COLORS, key, locale)
}

export function transmissionLabel(
  key: string | null | undefined,
  locale: string,
): string | null {
  return labelFrom(TRANSMISSIONS, key, locale)
}

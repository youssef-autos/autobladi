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

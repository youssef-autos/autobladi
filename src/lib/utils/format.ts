export type Locale = "ar" | "fr"

const numberFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })

export function formatPrice(price: number | null | undefined, locale: Locale = "fr"): string {
  if (price == null || Number.isNaN(price)) return "—"
  const value = numberFormatter.format(price)
  return locale === "ar" ? `${value} درهم` : `${value} DH`
}

export function formatMileage(km: number | null | undefined, locale: Locale = "fr"): string {
  if (km == null || Number.isNaN(km)) return "—"
  const value = numberFormatter.format(km)
  return locale === "ar" ? `${value} كم` : `${value} km`
}

/**
 * Normalises and formats a Moroccan phone number to "06XX-XX-XX-XX".
 * Accepts inputs with or without country code (+212 / 212 / 0).
 * Returns the original string if it cannot be parsed as 10-digit MA number.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  let normalized = digits
  if (normalized.startsWith("212")) normalized = "0" + normalized.slice(3)
  if (normalized.length !== 10) return phone
  return normalized.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})$/, "$1-$2-$3-$4")
}

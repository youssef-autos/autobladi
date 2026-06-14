import { format as dfFormat } from "date-fns"
import { ar, fr } from "date-fns/locale"

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

export function formatDate(
  date: Date | string | null | undefined,
  locale: Locale = "fr",
  pattern = "PPP",
): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return "—"
  return dfFormat(d, pattern, { locale: locale === "ar" ? ar : fr })
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

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const

/** Converts ASCII digits to Arabic-Indic digits. */
export function arabicNumerals(input: string | number): string {
  return String(input).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)])
}

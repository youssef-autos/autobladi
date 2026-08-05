/**
 * Shared types between Gemini server module, API routes, and client components.
 * Keep this file free of "server-only" so client components can import the types.
 */

export type AiLanguage = "ar" | "fr"

export type CarConditionAi = "neuf" | "occasion"

/**
 * Finer-grained condition the user picks in the estimation UI. Mapped to the
 * DB enum (`neuf` | `occasion`) for storage; passed verbatim to Gemini as a
 * pricing hint.
 */
export type ConditionGrade =
  | "excellent"
  | "very_good"
  | "good"
  | "fair"

export type DescriptionInput = {
  brand: string
  model: string
  year: number
  mileage?: number | null
  fuelType: string | null
  transmission: string | null
  options: string[]
  firstOwner: boolean
  accidentFree: boolean
  condition: CarConditionAi
  language: AiLanguage
}

export type PriceEstimateInput = {
  brand: string
  model: string
  year: number
  mileage: number
  fuelType: string
  condition: CarConditionAi
  conditionGrade?: ConditionGrade
  /** Whether the car has previously been in a traffic accident. */
  hadAccident?: boolean
  /** City name, when the user provided one — grounds local-demand claims. */
  city?: string
  language: AiLanguage
}

export type PriceEstimate = {
  priceMin: number
  priceMax: number
  /**
   * One natural-language paragraph: restates the price, explains the factors
   * that shaped it (year, mileage, condition, accident history), and notes
   * market demand — city-specific only when a city was actually provided.
   */
  explanation: string
}

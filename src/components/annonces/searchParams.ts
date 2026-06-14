import {
  createLoader,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server"

export const SORT_VALUES = ["newest", "priceAsc", "priceDesc", "mileageAsc"] as const
export const VIEW_VALUES = ["grid", "list"] as const
export const CONDITION_VALUES = ["occasion", "neuf"] as const
export const TRANSMISSION_VALUES = ["manuelle", "automatique"] as const
export const FUEL_VALUES = ["essence", "diesel", "hybrid", "electric", "lpg"] as const
export const OPTION_KEYS = [
  "climatisation",
  "gps",
  "camera",
  "toit_ouvrant",
  "abs",
  "esp",
  "bluetooth",
  "cuir",
] as const

export const PAGE_SIZE = 24

export const annoncesSearchParams = {
  q: parseAsString.withDefault(""),
  condition: parseAsStringLiteral(CONDITION_VALUES),
  brand: parseAsArrayOf(parseAsString).withDefault([]),
  model: parseAsArrayOf(parseAsString).withDefault([]),
  city: parseAsArrayOf(parseAsString).withDefault([]),
  secteur: parseAsArrayOf(parseAsString).withDefault([]),
  priceMin: parseAsInteger,
  priceMax: parseAsInteger,
  yearMin: parseAsInteger,
  yearMax: parseAsInteger,
  mileageMin: parseAsInteger,
  mileageMax: parseAsInteger,
  fuel: parseAsArrayOf(parseAsString).withDefault([]),
  transmission: parseAsStringLiteral(TRANSMISSION_VALUES),
  color: parseAsString.withDefault(""),
  doors: parseAsArrayOf(parseAsInteger).withDefault([]),
  options: parseAsArrayOf(parseAsString).withDefault([]),
  verified: parseAsBoolean.withDefault(false),
  featured: parseAsBoolean.withDefault(false),
  sort: parseAsStringLiteral(SORT_VALUES).withDefault("newest"),
  view: parseAsStringLiteral(VIEW_VALUES).withDefault("grid"),
  page: parseAsInteger.withDefault(1),
}

export type AnnoncesFilters = {
  q: string
  condition: (typeof CONDITION_VALUES)[number] | null
  brand: string[]
  model: string[]
  city: string[]
  secteur: string[]
  priceMin: number | null
  priceMax: number | null
  yearMin: number | null
  yearMax: number | null
  mileageMin: number | null
  mileageMax: number | null
  fuel: string[]
  transmission: (typeof TRANSMISSION_VALUES)[number] | null
  color: string
  doors: number[]
  options: string[]
  verified: boolean
  featured: boolean
  sort: (typeof SORT_VALUES)[number]
  view: (typeof VIEW_VALUES)[number]
  page: number
}

export const loadAnnoncesSearchParams = createLoader(annoncesSearchParams)

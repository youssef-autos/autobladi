import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server"

export const SORT_VALUES = ["popular", "rating", "newest"] as const

export const showroomsSearchParams = {
  q: parseAsString.withDefault(""),
  city: parseAsString.withDefault(""),
  minRating: parseAsInteger,
  sort: parseAsStringLiteral(SORT_VALUES).withDefault("popular"),
  page: parseAsInteger.withDefault(1),
}

export type ShowroomSearchFilters = {
  q: string
  city: string
  minRating: number | null
  sort: (typeof SORT_VALUES)[number]
  page: number
}

export const loadShowroomsSearchParams = createLoader(
  showroomsSearchParams,
)

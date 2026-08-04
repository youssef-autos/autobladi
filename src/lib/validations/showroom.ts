import { z } from "zod"

export const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

export type DayKey = (typeof DAY_KEYS)[number]

export const dayHoursSchema = z.object({
  open: z.boolean(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export type DayHours = z.infer<typeof dayHoursSchema>

export const openingHoursSchema = z.record(z.enum(DAY_KEYS), dayHoursSchema)

export type OpeningHoursMap = Record<DayKey, DayHours>

export const showroomInfoSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and -"),
  description: z.string().max(2000).nullable(),
  address: z.string().max(500).nullable(),
  city_id: z.uuid().nullable(),
  secteur_id: z
    .uuid()
    .nullable()
    .or(z.literal("").transform(() => null)),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  phone: z.string().max(40).nullable(),
  whatsapp: z.string().max(40).nullable(),
  email: z.string().email().nullable().or(z.literal("").transform(() => null)),
  website: z.string().url().nullable().or(z.literal("").transform(() => null)),
  facebook: z.string().url().nullable().or(z.literal("").transform(() => null)),
  instagram: z.string().url().nullable().or(z.literal("").transform(() => null)),
  youtube: z.string().url().nullable().or(z.literal("").transform(() => null)),
  tiktok: z.string().url().nullable().or(z.literal("").transform(() => null)),
  linkedin: z.string().url().nullable().or(z.literal("").transform(() => null)),
  logo_url: z.string().url().nullable(),
  cover_url: z.string().url().nullable(),
  opening_hours: openingHoursSchema.nullable(),
})

export type ShowroomInfoInput = z.infer<typeof showroomInfoSchema>

export const reviewSchema = z.object({
  showroomId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
})

export type ReviewInput = z.infer<typeof reviewSchema>

export const DEFAULT_HOURS: OpeningHoursMap = {
  monday: { open: true, from: "09:00", to: "19:00" },
  tuesday: { open: true, from: "09:00", to: "19:00" },
  wednesday: { open: true, from: "09:00", to: "19:00" },
  thursday: { open: true, from: "09:00", to: "19:00" },
  friday: { open: true, from: "09:00", to: "19:00" },
  saturday: { open: true, from: "09:00", to: "13:00" },
  sunday: { open: false },
}

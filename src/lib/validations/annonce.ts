import { z } from "zod"

export const AJOUTER_OPTION_KEYS = [
  "climatisation",
  "gps",
  "camera",
  "toit_ouvrant",
  "cuir",
  "abs",
  "esp",
  "airbags",
  "jantes_alu",
  "bluetooth",
  "usb",
  "cruise",
  "park_sensors",
  "auto_lights",
  "heated_seats",
] as const

const MIN_YEAR = 1990
const MAX_YEAR = new Date().getFullYear() + 1

export const step1Schema = z
  .object({
    condition: z.enum(["occasion", "neuf"]),
    brandId: z.uuid("ajouter.validation.selectOption"),
    modelId: z.uuid("ajouter.validation.selectOption"),
    cityId: z.uuid("ajouter.validation.selectOption"),
    // Optional neighborhood/secteur within the chosen city.
    secteurId: z.string(),
    year: z
      .number({ error: "ajouter.validation.invalidYear" })
      .int()
      .min(MIN_YEAR, "ajouter.validation.invalidYear")
      .max(MAX_YEAR, "ajouter.validation.invalidYear"),
    mileage: z.number().int().nonnegative().nullable(),
    fuelType: z.enum(["essence", "diesel", "hybrid", "electric", "lpg"]),
    transmission: z.enum(["manuelle", "automatique"]),
    doors: z.number().int().min(2).max(8),
    seats: z.number().int().min(2).max(9),
    // Optional: empty stays empty here and is normalized to null on save.
    color: z.string().max(40, "ajouter.validation.tooShort"),
    origine: z.string().max(30).nullable(),
    enginePower: z.number().int().positive().nullable(),
    engineSize: z.string().max(20).nullable(),
    firstOwner: z.boolean(),
    accidentFree: z.boolean(),
    // Equipment keys come from the data-driven catalog in src/lib/equipments.ts.
    // Stored as a free jsonb array, so we validate shape (non-empty strings)
    // rather than a fixed enum — that keeps the catalog the single source of truth.
    options: z.array(z.string().min(1).max(60)),
  })
  .refine(
    (data) => data.condition === "neuf" || data.mileage != null,
    {
      path: ["mileage"],
      message: "ajouter.validation.tooShort",
    },
  )

export const step2Schema = z.object({
  title: z.string().min(5, "ajouter.validation.tooShort").max(120),
  description: z.string().min(20, "ajouter.validation.tooShort").max(5000),
  price: z
    .number({ error: "ajouter.validation.invalidPrice" })
    .positive("ajouter.validation.invalidPrice")
    .max(100_000_000),
  negotiable: z.boolean(),
  contactPhone: z.string().min(8, "ajouter.validation.tooShort").max(20),
  contactWhatsapp: z.string().max(20).nullable(),
  // Pros-only promo video (YouTube / Facebook / TikTok). Empty → null.
  videoUrl: z
    .string()
    .url("ajouter.validation.invalidUrl")
    .nullable()
    .or(z.literal("").transform(() => null)),
})

export const annonceImageInput = z.object({
  url: z.url(),
  thumbnail_url: z.url(),
  is_main: z.boolean(),
})

export const step3Schema = z.object({
  images: z
    .array(annonceImageInput)
    .min(3, "ajouter.validation.minImages")
    .max(15),
})

export const step4Schema = z.object({
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, "ajouter.validation.termsRequired"),
})

export const fullAnnonceSchema = step1Schema
  .and(step2Schema)
  .and(step3Schema)
  .and(step4Schema)

export type Step1Values = z.infer<typeof step1Schema>
export type Step2Values = z.infer<typeof step2Schema>
export type Step3Values = z.infer<typeof step3Schema>
export type FullAnnonceValues = z.infer<typeof fullAnnonceSchema>

export type AnnonceFormValues = Step1Values &
  Step2Values &
  Step3Values & { acceptTerms: boolean }

// AI description schema lives next to the route at src/app/api/ai/generate-description/route.ts

import { z } from "zod"

export const MIN_YEAR = 1993
export const MAX_YEAR = new Date().getFullYear()

export const step1Schema = z.object({
  condition: z.enum(["occasion", "neuf"]),
  brandId: z.uuid("ajouter.validation.selectOption"),
  // Optional: empty stays empty here and is normalized to null on save.
  modelId: z.string(),
  cityId: z.string(),
  // Optional neighborhood/secteur within the chosen city.
  secteurId: z.string(),
  year: z
    .number({ error: "ajouter.validation.invalidYear" })
    .int()
    .min(MIN_YEAR, "ajouter.validation.invalidYear")
    .max(MAX_YEAR, "ajouter.validation.invalidYear"),
  mileage: z.number().int().nonnegative().nullable(),
  // Moteur & Transmission and Historique du véhicule are no longer collected
  // in the publish form — these all stay nullable/"unknown" going forward.
  fuelType: z.enum(["essence", "diesel", "hybrid", "electric", "lpg"]).nullable(),
  transmission: z.enum(["manuelle", "automatique"]).nullable(),
  doors: z.number().int().min(2).max(8).nullable(),
  seats: z.number().int().min(2).max(9).nullable(),
  // Optional: empty stays empty here and is normalized to null on save.
  color: z.string().max(40, "ajouter.validation.tooShort"),
  origine: z.string().max(30).nullable(),
  enginePower: z.number().int().positive().nullable(),
  engineSize: z.string().max(20).nullable(),
  firstOwner: z.boolean().nullable(),
  accidentFree: z.boolean().nullable(),
  // Equipment keys come from the data-driven catalog in src/lib/equipments.ts.
  // Stored as a free jsonb array, so we validate shape (non-empty strings)
  // rather than a fixed enum — that keeps the catalog the single source of truth.
  options: z.array(z.string().min(1).max(60)),
})

export const step2Schema = z.object({
  title: z.string().min(5, "ajouter.validation.tooShort").max(120),
  description: z.string().min(20, "ajouter.validation.tooShort").max(5000),
  price: z
    .number({ error: "ajouter.validation.invalidPrice" })
    .positive("ajouter.validation.invalidPrice")
    .max(100_000_000),
  negotiable: z.boolean(),
  // When true, the price is hidden from public buyers ("Prix sur demande")
  // but stays visible to the seller in their own dashboard.
  priceOnRequest: z.boolean(),
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

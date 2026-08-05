import { z } from "zod"

const MAX_YEAR = new Date().getFullYear() + 1

export const FUEL_OPTIONS = ["essence", "diesel", "hybrid", "electric", "lpg"] as const

export const CONDITION_OPTIONS = ["neuf", "excellent", "very_good", "good", "fair"] as const

export const estimationFormSchema = z.object({
  brandId: z.uuid("estimation.validation.required"),
  modelId: z.uuid("estimation.validation.required"),
  cityId: z.uuid().optional(),
  year: z
    .number({ error: "estimation.validation.year" })
    .int()
    .min(1990, "estimation.validation.year")
    .max(MAX_YEAR, "estimation.validation.year"),
  mileage: z
    .number({ error: "estimation.validation.mileage" })
    .int()
    .nonnegative("estimation.validation.mileage"),
  fuelType: z.enum(FUEL_OPTIONS),
  conditionGrade: z.enum(CONDITION_OPTIONS),
  // true = the car has been in a traffic accident, false = accident-free.
  accidentHistory: z.boolean(),
})

export type EstimationFormValues = z.infer<typeof estimationFormSchema>

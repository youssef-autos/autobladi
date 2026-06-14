import { z } from "zod"

export const planSchema = z.object({
  name: z.string().trim().min(1).max(60),
  name_ar: z.string().trim().max(60).nullable(),
  // The package price the user actually pays.
  price: z.number().nonnegative().max(1_000_000),
  // Optional "compare-at" price (0 = none). The discount % is derived from the
  // gap between this and `price`, so it's never entered by hand.
  original_price: z.number().nonnegative().max(1_000_000),
  duration_days: z.number().int().positive().max(3650),
  max_annonces: z.number().int().min(0).max(100_000),
  // Bilingual feature lists: `features` = French, `features_ar` = Arabic.
  features: z.array(z.string().trim().min(1).max(200)).max(30),
  features_ar: z.array(z.string().trim().min(1).max(200)).max(30),
  // Bilingual short tagline shown under the plan name.
  tagline: z.string().trim().max(200).nullable(),
  tagline_ar: z.string().trim().max(200).nullable(),
  // Admin-chosen "most popular" plan (highlighted on the upgrade page).
  is_popular: z.boolean(),
  is_active: z.boolean(),
})

export const planUpdateSchema = planSchema.extend({ id: z.uuid() })

export type PlanInput = z.infer<typeof planSchema>

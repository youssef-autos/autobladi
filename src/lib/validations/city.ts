import { z } from "zod"

/**
 * Slugifies a string the same way the Postgres `slugify()` function does
 * (see migration 001) — lowercase, ASCII, hyphen-separated. Used as the
 * client-side fallback so admins don't have to fill the slug manually.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const citySchema = z.object({
  name_ar: z.string().min(1, "name_ar_required").max(80),
  name_fr: z.string().min(1, "name_fr_required").max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "invalid_slug"),
  region: z
    .string()
    .max(120)
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
})

export type CityInput = z.infer<typeof citySchema>

export const cityUpdateSchema = citySchema.extend({
  id: z.uuid(),
})

export type CityUpdateInput = z.infer<typeof cityUpdateSchema>

/**
 * Loose schema for the JSON import — slug is optional (we derive it from
 * name_fr), region is always optional. We keep coercion light so admins
 * can paste data from heterogeneous sources.
 */
export const cityImportItemSchema = z.object({
  name_ar: z.string().min(1).max(80),
  name_fr: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  region: z.string().max(120).nullable().optional(),
})

export type CityImportItem = z.infer<typeof cityImportItemSchema>

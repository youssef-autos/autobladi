import { z } from "zod"

import { slugify } from "@/lib/validations/city"

export { slugify }

export const modelSchema = z.object({
  brand_id: z.uuid("brand_required"),
  name: z.string().min(1, "name_required").max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "invalid_slug"),
  is_active: z.boolean().default(true),
})

export type ModelInput = z.infer<typeof modelSchema>

export const modelUpdateSchema = modelSchema.extend({
  id: z.uuid(),
})

export type ModelUpdateInput = z.infer<typeof modelUpdateSchema>

/**
 * Import items reference brands by slug (not UUID) so admin-authored JSON
 * stays human-readable. We resolve the slug to a brand_id server-side; if
 * the brand doesn't exist, the entry is skipped (and counted) instead of
 * failing the whole import.
 */
export const modelImportItemSchema = z.object({
  brand_slug: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  is_active: z.boolean().optional(),
})

export type ModelImportItem = z.infer<typeof modelImportItemSchema>

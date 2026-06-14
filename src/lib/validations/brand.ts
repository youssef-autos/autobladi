import { z } from "zod"

import { slugify } from "@/lib/validations/city"

// Reuse the same slugify helper as cities — same convention everywhere.
export { slugify }

// 2000 chars — accommodates full Supabase Storage public URLs
const trimmedNullable = z
  .string()
  .max(2000)
  .nullable()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : null))

export const brandSchema = z.object({
  name: z.string().min(1, "name_required").max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "invalid_slug"),
  logo_url: trimmedNullable,
  order_index: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
})

export type BrandInput = z.infer<typeof brandSchema>

export const brandUpdateSchema = brandSchema.extend({
  id: z.uuid(),
})

export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>

/**
 * Loose import schema — slug is optional (derived from name), logo_url /
 * order_index / is_active have sensible defaults so the JSON files can be
 * as small as `[{ "name": "BMW" }]`.
 */
export const brandImportItemSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  logo_url: z.string().url().max(2000).nullable().optional(),
  order_index: z.coerce.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
})

export type BrandImportItem = z.infer<typeof brandImportItemSchema>

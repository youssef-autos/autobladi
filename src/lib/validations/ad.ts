import { z } from "zod"

/** ISO date string (YYYY-MM-DD) → stored as timestamptz at midnight UTC. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional()
  .transform((v) => (v ? `${v}T00:00:00Z` : null))

export const adSchema = z.object({
  placement_id: z.uuid("placement_required"),
  title: z.string().min(1, "title_required").max(200),
  image_url: z.string().url("image_url_required"),
  link_url: z
    .string()
    .url()
    .max(500)
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  starts_at: isoDate,
  ends_at: isoDate,
  is_active: z.boolean().default(true),
})

export type AdInput = z.infer<typeof adSchema>

export const adUpdateSchema = adSchema.extend({ id: z.uuid() })
export type AdUpdateInput = z.infer<typeof adUpdateSchema>

export const placementUpdateSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  width: z.coerce.number().int().min(1).max(9999).nullable().optional(),
  height: z.coerce.number().int().min(1).max(9999).nullable().optional(),
  description: z
    .string()
    .max(300)
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
})

export type PlacementUpdateInput = z.infer<typeof placementUpdateSchema>

export const placementVisibilitySchema = z.object({
  id: z.uuid(),
  is_active: z.boolean(),
})

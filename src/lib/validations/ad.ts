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

const dimension = z.coerce.number().int().min(1).max(9999)

/**
 * Full admin-editable settings for a single ad slot. Keyed by `slug` (not id)
 * so the action can upsert into ad_placements, creating the row on first save.
 */
export const adSlotSettingsSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().min(1, "name_required").max(120),
  is_active: z.boolean(),
  device: z.enum(["mobile", "desktop", "both"]),
  default_provider: z.enum(["adsense", "direct"]),
  width: dimension,
  height: dimension,
  width_mobile: dimension,
  height_mobile: dimension,
  adsense_slot_id: z
    .string()
    .max(40)
    .optional()
    .default("")
    .transform((v) => v.trim()),
  lazy: z.boolean().default(true),
})

export type AdSlotSettingsInput = z.infer<typeof adSlotSettingsSchema>

/**
 * The global AdSense publisher id. Empty string is allowed (disables AdSense);
 * otherwise it must look like a real "ca-pub-…" id.
 */
export const adsenseClientSchema = z.object({
  adsense_client_id: z
    .string()
    .trim()
    .max(60)
    .refine((v) => v === "" || /^ca-pub-\d{6,}$/.test(v), "invalid_adsense_id"),
})

export type AdsenseClientInput = z.infer<typeof adsenseClientSchema>

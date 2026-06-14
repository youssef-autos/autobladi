import { z } from "zod"

import { slugify } from "@/lib/validations/city"

export { slugify }

const contentField = z
  .string()
  .max(100000)
  .nullable()
  .optional()
  .transform((v) => (v && v.trim() ? v : null))

export const pageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "invalid_slug"),
  title_fr: z.string().min(1, "title_fr_required").max(160),
  title_ar: z.string().min(1, "title_ar_required").max(160),
  content_fr: contentField,
  content_ar: contentField,
  is_published: z.boolean().default(true),
  show_in_footer: z.boolean().default(true),
  order_index: z.coerce.number().int().min(0).max(9999).default(0),
})

export type PageInput = z.infer<typeof pageSchema>

export const pageUpdateSchema = pageSchema.extend({ id: z.uuid() })

export type PageUpdateInput = z.infer<typeof pageUpdateSchema>

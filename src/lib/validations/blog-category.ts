import { z } from "zod"

import { slugify } from "@/lib/validations/city"

export { slugify }

export const blogCategorySchema = z.object({
  name_ar: z.string().min(1, "name_ar_required").max(80),
  name_fr: z.string().min(1, "name_fr_required").max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "invalid_slug"),
  order_index: z.coerce.number().int().min(0).max(9999).default(0),
})

export type BlogCategoryInput = z.infer<typeof blogCategorySchema>

export const blogCategoryUpdateSchema = blogCategorySchema.extend({
  id: z.uuid(),
})

export type BlogCategoryUpdateInput = z.infer<typeof blogCategoryUpdateSchema>

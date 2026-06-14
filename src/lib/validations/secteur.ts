import { z } from "zod"

import { slugify } from "@/lib/validations/city"

export { slugify }

export const secteurSchema = z.object({
  city_id: z.uuid("city_id_required"),
  name_ar: z.string().min(1, "name_ar_required").max(80),
  name_fr: z.string().min(1, "name_fr_required").max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "invalid_slug"),
})

export type SecteurInput = z.infer<typeof secteurSchema>

export const secteurUpdateSchema = secteurSchema.extend({ id: z.uuid() })
export type SecteurUpdateInput = z.infer<typeof secteurUpdateSchema>

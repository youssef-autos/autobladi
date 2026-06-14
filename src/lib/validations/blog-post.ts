import { z } from "zod"

import { slugify } from "@/lib/validations/city"

export { slugify }

const nullableTrimmed = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null))

// Markdown body — kept as-is (don't trim interior whitespace).
const nullableMarkdown = () =>
  z
    .string()
    .max(100000)
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v : null))

export const blogPostSchema = z.object({
  // Primary content = Arabic (the site's default locale).
  title: z.string().min(1, "title_required").max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "invalid_slug"),
  excerpt: nullableTrimmed(500),
  content: nullableMarkdown(),
  // French translation (optional — public reads fall back to the primary).
  title_fr: nullableTrimmed(200),
  excerpt_fr: nullableTrimmed(500),
  content_fr: nullableMarkdown(),
  cover_image: nullableTrimmed(1000),
  category_id: z
    .uuid()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  is_published: z.boolean().default(false),
})

export type BlogPostInput = z.infer<typeof blogPostSchema>

export const blogPostUpdateSchema = blogPostSchema.extend({
  id: z.uuid(),
})

export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>

import { z } from "zod"

export const blogCommentSchema = z.object({
  postId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  content: z
    .string()
    .min(3, "tooShort")
    .max(2000, "tooLong"),
})

export type BlogCommentValues = z.infer<typeof blogCommentSchema>

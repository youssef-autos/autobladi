import { z } from "zod"

export const contactSchema = z.object({
  name: z.string().min(2, "nameRequired").max(120),
  email: z.email("emailInvalid").max(160),
  phone: z.string().max(40).optional().or(z.literal("")),
  subject: z.string().max(160).optional().or(z.literal("")),
  message: z.string().min(10, "messageTooShort").max(4000),
})

export type ContactValues = z.infer<typeof contactSchema>

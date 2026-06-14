import { z } from "zod"

export const adInquirySchema = z.object({
  name: z.string().min(2, "nameRequired").max(120),
  email: z.email("emailInvalid").max(160),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(120).optional().or(z.literal("")),
  message: z
    .string()
    .min(10, "messageTooShort")
    .max(4000),
})

export type AdInquiryValues = z.infer<typeof adInquirySchema>

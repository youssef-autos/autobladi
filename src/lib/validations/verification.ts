import { z } from "zod"

export const verificationFormSchema = z.object({
  company_name: z.string().min(2).max(120),
  manager_name: z.string().min(2).max(80),
  rc_number: z
    .string()
    .min(1)
    .max(30)
    .regex(/^\d+$/, "rc_must_be_numeric"),
  professional_phone: z.string().min(8).max(40),
  address: z.string().min(10).max(500),
  rc_document_path: z.string().min(3),
  id_card_path: z.string().min(3),
})

export type VerificationFormValues = z.infer<typeof verificationFormSchema>

export const MAX_VERIFICATION_BYTES = 10 * 1024 * 1024
export const VERIFICATION_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const

export type VerificationMime = (typeof VERIFICATION_MIME_TYPES)[number]

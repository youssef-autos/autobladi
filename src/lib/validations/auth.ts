import { z } from "zod"

export const signUpSchema = z
  .object({
    fullName: z.string().min(2, "validation.fullNameRequired"),
    email: z.email("validation.invalidEmail"),
    phone: z.string().min(8, "validation.phoneRequired"),
    password: z.string().min(8, "validation.passwordTooShort"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, "validation.termsRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "validation.passwordMismatch",
  })

export const signInSchema = z.object({
  email: z.email("validation.invalidEmail"),
  password: z.string().min(1, "validation.required"),
})

export const forgotPasswordSchema = z.object({
  email: z.email("validation.invalidEmail"),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "validation.passwordTooShort"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "validation.passwordMismatch",
  })

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

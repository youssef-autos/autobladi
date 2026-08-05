"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircle2, KeyRound, Mail } from "lucide-react"

import { resetPassword } from "@/app/[locale]/auth/actions"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { Field } from "@/components/ui/Field"
import { Input } from "@/components/ui/input"
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth"

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword")
  const tValidation = useTranslations("validation")
  const locale = useLocale()
  const [pending, startTransition] = useTransition()
  const [sentTo, setSentTo] = useState<string | null>(null)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const tr = (key?: string) =>
    key ? (key.startsWith("validation.") ? tValidation(key.slice("validation.".length)) : key) : ""

  function onSubmit(values: ForgotPasswordInput) {
    startTransition(async () => {
      const result = await resetPassword(values)
      if (result.ok) {
        setSentTo(values.email)
      }
    })
  }

  const errors = form.formState.errors

  if (sentTo) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-12 text-moroccan-gold-500" aria-hidden="true" />
        <h2 className="text-2xl font-bold">{t("successTitle")}</h2>
        <p className="text-muted-foreground">{t("successMessage", { email: sentTo })}</p>
        <Link
          href={`/${locale}/auth/connexion`}
          className="inline-block text-sm font-medium text-moroccan-red-500 hover:underline"
        >
          {t("backToSignIn")}
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <header className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-moroccan-red-50 text-moroccan-red-600">
          <KeyRound className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field
          label={t("email")}
          error={errors.email?.message ? tr(errors.email.message) : undefined}
        >
          <div className="relative">
            <Mail
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="email"
              aria-invalid={!!errors.email}
              className="h-11 rounded-xl border-border bg-background ps-9"
              {...form.register("email")}
            />
          </div>
        </Field>

        <MoroccanButton type="submit" disabled={pending} className="w-full">
          {pending ? t("submitting") : t("submit")}
        </MoroccanButton>

        <Link
          href={`/${locale}/auth/connexion`}
          className="block text-center text-sm font-medium text-muted-foreground hover:text-moroccan-red-500"
        >
          {t("backToSignIn")}
        </Link>
      </form>
    </div>
  )
}

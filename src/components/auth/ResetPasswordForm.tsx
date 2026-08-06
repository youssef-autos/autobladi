"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircle2, LockKeyhole } from "lucide-react"

import { updatePassword } from "@/app/[locale]/auth/actions"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { Field } from "@/components/ui/Field"
import { PasswordInput } from "@/components/ui/PasswordInput"
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth"

export function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword")
  const tValidation = useTranslations("validation")
  const locale = useLocale()
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  const tr = (key?: string) =>
    key ? (key.startsWith("validation.") ? tValidation(key.slice("validation.".length)) : key) : ""

  function onSubmit(values: ResetPasswordInput) {
    setServerError(null)
    startTransition(async () => {
      const result = await updatePassword(values)
      if (!result.ok) {
        setServerError(result.error)
        return
      }
      setDone(true)
    })
  }

  const errors = form.formState.errors

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-12 text-moroccan-gold-500" aria-hidden="true" />
        <h2 className="text-2xl font-bold">{t("successTitle")}</h2>
        <p className="text-muted-foreground">{t("successMessage")}</p>
        <Link
          href={`/${locale}/auth/connexion`}
          className="inline-block text-sm font-medium text-moroccan-red-500 hover:underline"
        >
          {t("signInLink")}
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <header className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-moroccan-red-50 text-moroccan-red-600">
          <LockKeyhole className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field
          label={t("newPassword")}
          error={errors.password?.message ? tr(errors.password.message) : undefined}
        >
          <PasswordInput aria-invalid={!!errors.password} {...form.register("password")} />
        </Field>

        <Field
          label={t("confirmPassword")}
          error={errors.confirmPassword?.message ? tr(errors.confirmPassword.message) : undefined}
        >
          <PasswordInput
            aria-invalid={!!errors.confirmPassword}
            {...form.register("confirmPassword")}
          />
        </Field>

        {serverError && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {tr(serverError)}
          </p>
        )}

        <MoroccanButton type="submit" disabled={pending} className="w-full">
          {pending ? t("submitting") : t("submit")}
        </MoroccanButton>
      </form>
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircle2 } from "lucide-react"

import { updatePassword } from "@/app/[locale]/auth/actions"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth"
import { cn } from "@/lib/utils"

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
          {locale === "ar" ? "تسجيل الدخول" : "Se connecter"}
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("newPassword")}</Label>
          <Input
            id="password"
            type="password"
            aria-invalid={!!errors.password}
            className={cn(
              "h-11 rounded-xl border-border bg-background",
              errors.password && "border-destructive"
            )}
            {...form.register("password")}
          />
          {errors.password?.message && (
            <p className="text-sm text-destructive">{tr(errors.password.message)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <Input
            id="confirmPassword"
            type="password"
            aria-invalid={!!errors.confirmPassword}
            className={cn(
              "h-11 rounded-xl border-border bg-background",
              errors.confirmPassword && "border-destructive"
            )}
            {...form.register("confirmPassword")}
          />
          {errors.confirmPassword?.message && (
            <p className="text-sm text-destructive">{tr(errors.confirmPassword.message)}</p>
          )}
        </div>

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

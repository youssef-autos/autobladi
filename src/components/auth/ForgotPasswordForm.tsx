"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircle2 } from "lucide-react"

import { resetPassword } from "@/app/[locale]/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth"
import { cn } from "@/lib/utils"

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
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            aria-invalid={!!errors.email}
            className={cn(
              "h-11 rounded-xl border-border bg-background",
              errors.email && "border-destructive"
            )}
            {...form.register("email")}
          />
          {errors.email?.message && (
            <p className="text-sm text-destructive">{tr(errors.email.message)}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-xl bg-moroccan-gradient hover:brightness-105 text-base font-semibold"
        >
          {pending ? t("submitting") : t("submit")}
        </Button>

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

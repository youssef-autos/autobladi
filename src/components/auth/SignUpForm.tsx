"use client"

import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircle2 } from "lucide-react"

import { signUp } from "@/app/[locale]/auth/actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth"
import { cn } from "@/lib/utils"

export function SignUpForm() {
  const t = useTranslations("auth.signUp")
  const tValidation = useTranslations("validation")
  const locale = useLocale()
  const [pending, startTransition] = useTransition()
  const [successEmail, setSuccessEmail] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  })

  function onSubmit(values: SignUpInput) {
    setServerError(null)
    startTransition(async () => {
      const result = await signUp(values)
      if (!result.ok) {
        setServerError(result.error)
        return
      }
      setSuccessEmail(values.email)
    })
  }

  const errors = form.formState.errors
  const tr = (key?: string) =>
    key ? (key.startsWith("validation.") ? tValidation(key.slice("validation.".length)) : key) : ""

  if (successEmail) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-12 text-moroccan-gold-500" aria-hidden="true" />
        <h2 className="text-2xl font-bold">{t("successTitle")}</h2>
        <p className="text-muted-foreground">{t("successMessage", { email: successEmail })}</p>
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
        <Field
          id="fullName"
          label={t("fullName")}
          placeholder={t("fullNamePlaceholder")}
          error={tr(errors.fullName?.message)}
          {...form.register("fullName")}
        />
        <Field
          id="email"
          type="email"
          label={t("email")}
          placeholder={t("emailPlaceholder")}
          error={tr(errors.email?.message)}
          {...form.register("email")}
        />
        <Field
          id="phone"
          type="tel"
          label={t("phone")}
          placeholder={t("phonePlaceholder")}
          error={tr(errors.phone?.message)}
          {...form.register("phone")}
        />
        <Field
          id="password"
          type="password"
          label={t("password")}
          placeholder={t("passwordPlaceholder")}
          error={tr(errors.password?.message)}
          {...form.register("password")}
        />
        <Field
          id="confirmPassword"
          type="password"
          label={t("confirmPassword")}
          placeholder={t("passwordPlaceholder")}
          error={tr(errors.confirmPassword?.message)}
          {...form.register("confirmPassword")}
        />

        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <Controller
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <Checkbox
                  id="acceptTerms"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              )}
            />
            <Label htmlFor="acceptTerms" className="text-sm leading-snug">
              {t("terms")}
            </Label>
          </div>
          {errors.acceptTerms?.message && (
            <p className="text-sm text-destructive">{tr(errors.acceptTerms.message)}</p>
          )}
        </div>

        {serverError && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError.startsWith("auth.") || serverError.startsWith("validation.")
              ? tr(serverError)
              : serverError}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className={cn(
            "h-11 w-full rounded-xl bg-moroccan-gradient hover:brightness-105 text-base font-semibold"
          )}
        >
          {pending ? t("submitting") : t("submit")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link
            href={`/${locale}/auth/connexion`}
            className="font-medium text-moroccan-red-500 hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </form>
    </div>
  )
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  error?: string
}

const Field = ({ id, label, error, className, ...inputProps }: FieldProps) => {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={!!error}
        className={cn(
          "h-11 rounded-xl border-border bg-background",
          error && "border-destructive",
          className
        )}
        {...inputProps}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

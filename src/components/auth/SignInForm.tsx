"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"

import { signIn } from "@/app/[locale]/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInSchema, type SignInInput } from "@/lib/validations/auth"
import { cn } from "@/lib/utils"

export function SignInForm() {
  const t = useTranslations("auth.signIn")
  const tValidation = useTranslations("validation")
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  const tr = (key?: string) =>
    key ? (key.startsWith("validation.") ? tValidation(key.slice("validation.".length)) : key) : ""

  function onSubmit(values: SignInInput) {
    setServerError(null)
    startTransition(async () => {
      const result = await signIn(values)
      if (!result.ok) {
        setServerError(result.error)
        return
      }
      const returnTo = searchParams.get("returnTo")
      // Admins land on /admin by default; everyone else on /dashboard. An
      // explicit ?returnTo=... (e.g. from an auth-gated page) always wins.
      const accountType =
        typeof result.data?.accountType === "string"
          ? result.data.accountType
          : null
      const fallback =
        accountType === "admin" ? `/${locale}/admin` : `/${locale}/dashboard`
      router.push(returnTo && returnTo.startsWith("/") ? returnTo : fallback)
      router.refresh()
    })
  }

  const errors = form.formState.errors

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
            placeholder={t("emailPlaceholder")}
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <Link
              href={`/${locale}/auth/mot-de-passe-oublie`}
              className="text-xs text-moroccan-red-500 hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder={t("passwordPlaceholder")}
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
          className="h-11 w-full rounded-xl bg-moroccan-gradient hover:brightness-105 text-base font-semibold"
        >
          {pending ? t("submitting") : t("submit")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href={`/${locale}/auth/inscription`}
            className="font-medium text-moroccan-red-500 hover:underline"
          >
            {t("createAccount")}
          </Link>
        </p>
      </form>
    </div>
  )
}

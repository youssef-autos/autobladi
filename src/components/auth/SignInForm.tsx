"use client"

import { useState, useTransition, type ReactNode } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LogIn, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"

import { signIn } from "@/app/[locale]/auth/actions"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { Field } from "@/components/ui/Field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { signInSchema, type SignInInput } from "@/lib/validations/auth"

type Props = {
  /** Rendered between the header and the form fields (OAuth buttons + divider). */
  socialLogin?: ReactNode
}

export function SignInForm({ socialLogin }: Props) {
  const t = useTranslations("auth.signIn")
  const tValidation = useTranslations("validation")
  const tRoot = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  const tr = (key?: string) => {
    if (!key) return ""
    if (key.startsWith("validation.")) return tValidation(key.slice("validation.".length))
    if (key.startsWith("auth.")) return tRoot(key)
    return key
  }

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
      <header className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-moroccan-red-50 text-moroccan-red-600">
          <LogIn className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </header>

      {socialLogin && <div className="mb-6">{socialLogin}</div>}

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
              placeholder={t("emailPlaceholder")}
              aria-invalid={!!errors.email}
              className="h-11 rounded-xl border-border bg-background ps-9"
              {...form.register("email")}
            />
          </div>
        </Field>

        <Field
          label={t("password")}
          error={errors.password?.message ? tr(errors.password.message) : undefined}
          action={
            <Link
              href={`/${locale}/auth/mot-de-passe-oublie`}
              className="text-xs text-moroccan-red-500 hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          }
        >
          <PasswordInput
            placeholder={t("passwordPlaceholder")}
            aria-invalid={!!errors.password}
            {...form.register("password")}
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

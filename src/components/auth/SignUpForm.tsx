"use client"

import { useRef, useState, useTransition, type ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  User,
} from "lucide-react"

import { signUp } from "@/app/[locale]/auth/actions"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { Checkbox } from "@/components/ui/checkbox"
import { Field } from "@/components/ui/Field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { useRouter } from "@/i18n/navigation"
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth"

type Props = {
  /** Rendered on step 1 only, between the header and the form fields. */
  socialLogin?: ReactNode
}

const STEP_FIELDS: (keyof SignUpInput)[][] = [
  ["fullName", "phone"],
  ["email", "password", "confirmPassword"],
  ["acceptTerms"],
]

export function SignUpForm({ socialLogin }: Props) {
  const t = useTranslations("auth.signUp")
  const tValidation = useTranslations("validation")
  const tRoot = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [successEmail, setSuccessEmail] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [termsError, setTermsError] = useState(false)
  const advancingRef = useRef(false)

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
    // Same double-invocation guard as goNext() — see its comment.
    if (advancingRef.current) return
    advancingRef.current = true
    setServerError(null)
    startTransition(async () => {
      try {
        const result = await signUp(values)
        if (!result.ok) {
          setServerError(result.error)
          return
        }
        if (result.data?.autoConfirmed) {
          router.push("/dashboard")
          return
        }
        setSuccessEmail(values.email)
      } finally {
        advancingRef.current = false
      }
    })
  }

  const errors = form.formState.errors
  const tr = (key?: string) => {
    if (!key) return ""
    if (key.startsWith("validation.")) return tValidation(key.slice("validation.".length))
    if (key.startsWith("auth.")) return tRoot(key)
    return key
  }

  async function goNext() {
    // Guards against a double-invocation firing two overlapping calls (e.g. a
    // fast double-click) racing each other before the first trigger() resolves.
    if (advancingRef.current) return
    advancingRef.current = true
    try {
      const valid = await form.trigger(STEP_FIELDS[step])
      if (valid) setStep((s) => s + 1)
    } finally {
      advancingRef.current = false
    }
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1))
  }

  function trySubmit() {
    // Checked directly against the field's own value instead of relying on
    // errors.acceptTerms: zodResolver re-validates the whole schema on every
    // trigger()/handleSubmit() call (including the ones goNext() makes on
    // earlier steps), so that shared error can already be populated before
    // the user has ever reached this step.
    if (!form.getValues("acceptTerms")) {
      setTermsError(true)
      return
    }
    void form.handleSubmit(onSubmit)()
  }

  if (successEmail) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-12 text-moroccan-gold-500" aria-hidden="true" />
        <h2 className="text-2xl font-bold">{t("successTitle")}</h2>
        <p className="text-muted-foreground">{t("successMessage", { email: successEmail })}</p>
      </div>
    )
  }

  const stepLabels = [t("steps.info"), t("steps.security"), t("steps.end")]

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <header className="mb-6 text-center space-y-1">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="mb-6 space-y-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-moroccan-red-500 transition-all duration-300"
            style={{ width: `${((step + 1) / stepLabels.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs font-semibold tracking-wide">
          {stepLabels.map((label, i) => (
            <span
              key={label}
              className={i <= step ? "text-moroccan-red-600" : "text-muted-foreground"}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {step === 0 && socialLogin && (
        <div className="mb-6">{socialLogin}</div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          trySubmit()
        }}
        className="space-y-5"
        noValidate
        onKeyDown={(e) => {
          // Always intercept Enter ourselves — never let it fall through to a
          // native submit, whose behavior depends on which step is current at
          // the time the (possibly delayed) keydown is actually processed.
          if (e.key !== "Enter") return
          e.preventDefault()
          if (step < stepLabels.length - 1) {
            void goNext()
          } else {
            trySubmit()
          }
        }}
      >
        {step === 0 && (
          <>
            <Field label={t("fullName")} error={tr(errors.fullName?.message)}>
              <div className="relative">
                <User
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder={t("fullNamePlaceholder")}
                  aria-invalid={!!errors.fullName}
                  className="h-11 rounded-xl border-border bg-background ps-9"
                  {...form.register("fullName")}
                />
              </div>
            </Field>

            <Field label={t("phone")} error={tr(errors.phone?.message)}>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="tel"
                  placeholder={t("phonePlaceholder")}
                  aria-invalid={!!errors.phone}
                  className="h-11 rounded-xl border-border bg-background ps-9"
                  {...form.register("phone")}
                />
              </div>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label={t("email")} error={tr(errors.email?.message)}>
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
            <Field label={t("password")} error={tr(errors.password?.message)}>
              <PasswordInput
                placeholder={t("passwordPlaceholder")}
                aria-invalid={!!errors.password}
                {...form.register("password")}
              />
            </Field>
            <Field label={t("confirmPassword")} error={tr(errors.confirmPassword?.message)}>
              <PasswordInput
                placeholder={t("confirmPasswordPlaceholder")}
                aria-invalid={!!errors.confirmPassword}
                {...form.register("confirmPassword")}
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <Controller
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <Checkbox
                    id="acceptTerms"
                    checked={field.value}
                    onCheckedChange={(v) => {
                      field.onChange(v === true)
                      if (v === true) setTermsError(false)
                    }}
                  />
                )}
              />
              <Label htmlFor="acceptTerms" className="text-sm leading-snug">
                {t("terms")}
              </Label>
            </div>
            {termsError && (
              <p className="text-sm text-destructive">{tValidation("termsRequired")}</p>
            )}
          </div>
        )}

        {serverError && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {tr(serverError)}
          </p>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center justify-center gap-2 h-11 shrink-0 rounded-xl border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t("back")}
            </button>
          )}
          {step < stepLabels.length - 1 ? (
            <MoroccanButton type="button" onClick={goNext} className="flex-1">
              {t("next")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </MoroccanButton>
          ) : (
            <MoroccanButton type="submit" disabled={pending} className="flex-1">
              {pending ? t("submitting") : t("submit")}
            </MoroccanButton>
          )}
        </div>

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

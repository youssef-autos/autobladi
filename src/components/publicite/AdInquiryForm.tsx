"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { CheckCircle2 } from "lucide-react"

import { submitAdInquiry } from "@/app/[locale]/(main)/publicite/actions"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import {
  adInquirySchema,
  type AdInquiryValues,
} from "@/lib/validations/publicite"
import { cn } from "@/lib/utils"

export function AdInquiryForm() {
  const t = useTranslations("publicite")
  const tValidation = useTranslations("publicite.validation")
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdInquiryValues>({
    resolver: zodResolver(adInquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      message: "",
    },
  })

  function onSubmit(values: AdInquiryValues) {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await submitAdInquiry(values)
      if (res.ok) {
        setSubmitted(true)
        reset()
        return
      }
      setErrorMsg(t("form.errorDesc"))
    })
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-moroccan-mint-500/40 bg-moroccan-mint-500/5 p-8 text-center space-y-3">
        <CheckCircle2
          className="size-12 text-moroccan-mint-500 mx-auto"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <p className="font-display text-xl font-bold text-foreground">
          {t("form.successTitle")}
        </p>
        <p className="text-sm text-muted-foreground">{t("form.successDesc")}</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-sm text-moroccan-red-500 hover:underline"
        >
          {t("hero.cta")} →
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-5"
      noValidate
    >
      <header className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-foreground">
          {t("form.title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("form.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label={t("form.name")}
          error={errors.name ? tValidation(errors.name.message ?? "nameRequired") : undefined}
        >
          <input
            type="text"
            autoComplete="name"
            placeholder={t("form.namePlaceholder")}
            className={inputCls(!!errors.name)}
            {...register("name")}
          />
        </Field>

        <Field
          label={t("form.email")}
          error={errors.email ? tValidation(errors.email.message ?? "emailInvalid") : undefined}
        >
          <input
            type="email"
            autoComplete="email"
            placeholder={t("form.emailPlaceholder")}
            className={inputCls(!!errors.email)}
            {...register("email")}
          />
        </Field>

        <Field label={t("form.phone")}>
          <input
            type="tel"
            autoComplete="tel"
            placeholder={t("form.phonePlaceholder")}
            className={inputCls(false)}
            {...register("phone")}
          />
        </Field>

        <Field label={t("form.company")}>
          <input
            type="text"
            autoComplete="organization"
            placeholder={t("form.companyPlaceholder")}
            className={inputCls(false)}
            {...register("company")}
          />
        </Field>
      </div>

      <Field
        label={t("form.message")}
        error={
          errors.message
            ? tValidation(errors.message.message ?? "messageRequired")
            : undefined
        }
      >
        <textarea
          rows={6}
          placeholder={t("form.messagePlaceholder")}
          className={cn(inputCls(!!errors.message), "h-auto py-3 resize-y")}
          {...register("message")}
        />
      </Field>

      {errorMsg && (
        <p
          role="alert"
          className="text-sm rounded-lg bg-moroccan-red-50 border border-moroccan-red-500/30 text-moroccan-red-700 px-3 py-2"
        >
          {t("form.errorTitle")} — {errorMsg}
        </p>
      )}

      <MoroccanButton type="submit" loading={pending} className="w-full md:w-auto">
        {pending ? t("form.submitting") : t("form.submit")}
      </MoroccanButton>
    </form>
  )
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full h-11 rounded-xl border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/70",
    "focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60",
    hasError ? "border-moroccan-red-500/60" : "border-border",
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {error && (
        <span className="block text-xs text-moroccan-red-600">{error}</span>
      )}
    </label>
  )
}

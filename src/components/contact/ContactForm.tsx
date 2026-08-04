"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { CheckCircle2 } from "lucide-react"

import { submitContactMessage } from "@/app/[locale]/(main)/contact/actions"
import { Field } from "@/components/ui/Field"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { contactSchema, type ContactValues } from "@/lib/validations/contact"
import { cn } from "@/lib/utils"

export function ContactForm() {
  const t = useTranslations("contactPage.form")
  const tValidation = useTranslations("contactPage.validation")
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  })

  function onSubmit(values: ContactValues) {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await submitContactMessage(values)
      if (res.ok) {
        setSubmitted(true)
        reset()
        return
      }
      setErrorMsg(
        res.error === "rate_limited" ? t("rateLimited") : t("errorDesc"),
      )
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
          {t("successTitle")}
        </p>
        <p className="text-sm text-muted-foreground">{t("successDesc")}</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-sm text-moroccan-red-500 hover:underline"
        >
          {t("sendAnother")} →
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
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label={t("name")}
          error={
            errors.name ? tValidation(errors.name.message ?? "nameRequired") : undefined
          }
        >
          <input
            type="text"
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            className={inputCls(!!errors.name)}
            {...register("name")}
          />
        </Field>

        <Field
          label={t("email")}
          error={
            errors.email ? tValidation(errors.email.message ?? "emailInvalid") : undefined
          }
        >
          <input
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            className={inputCls(!!errors.email)}
            {...register("email")}
          />
        </Field>

        <Field label={t("phone")}>
          <input
            type="tel"
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
            className={inputCls(false)}
            {...register("phone")}
          />
        </Field>

        <Field label={t("subject")}>
          <input
            type="text"
            placeholder={t("subjectPlaceholder")}
            className={inputCls(false)}
            {...register("subject")}
          />
        </Field>
      </div>

      <Field
        label={t("message")}
        error={
          errors.message
            ? tValidation(errors.message.message ?? "messageTooShort")
            : undefined
        }
      >
        <textarea
          rows={6}
          placeholder={t("messagePlaceholder")}
          className={cn(inputCls(!!errors.message), "h-auto py-3 resize-y")}
          {...register("message")}
        />
      </Field>

      {errorMsg && (
        <p
          role="alert"
          className="text-sm rounded-lg bg-moroccan-red-50 border border-moroccan-red-500/30 text-moroccan-red-700 px-3 py-2"
        >
          {t("errorTitle")} — {errorMsg}
        </p>
      )}

      <MoroccanButton type="submit" loading={pending} className="w-full md:w-auto">
        {pending ? t("submitting") : t("submit")}
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


"use client"

import { useState, useTransition } from "react"
import { Info, Send } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { submitVerification } from "@/app/[locale]/dashboard/verification/actions"
import { DocumentUpload } from "@/components/verification/DocumentUpload"
import { VerificationStepper } from "@/components/verification/VerificationStepper"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  userId: string
  onSubmitted?: () => void
}

type FilePointer = {
  path: string
  filename: string
  contentType: string
}

export function VerificationForm({ userId, onSubmitted }: Props) {
  const t = useTranslations("verification.form")
  const tPage = useTranslations("verification")
  const [pending, startTransition] = useTransition()
  const [companyName, setCompanyName] = useState("")
  const [managerName, setManagerName] = useState("")
  const [rcNumber, setRcNumber] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [rcDocument, setRcDocument] = useState<FilePointer | null>(null)
  const [idCard, setIdCard] = useState<FilePointer | null>(null)

  const docsReady = !!rcDocument && !!idCard
  const infoReady =
    companyName.trim().length >= 2 &&
    managerName.trim().length >= 2 &&
    /^\d+$/.test(rcNumber) &&
    phone.trim().length >= 8 &&
    address.trim().length >= 10
  const currentStep: "info" | "documents" | "review" = !infoReady
    ? "info"
    : !docsReady
      ? "documents"
      : "review"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!docsReady || !infoReady) return
    startTransition(async () => {
      const result = await submitVerification({
        company_name: companyName.trim(),
        manager_name: managerName.trim(),
        rc_number: rcNumber.trim(),
        professional_phone: phone.trim(),
        address: address.trim(),
        rc_document_path: rcDocument!.path,
        id_card_path: idCard!.path,
      })
      if (!result.ok) {
        toast.error(t("errorTitle"), { description: result.error })
        return
      }
      toast.success(t("successTitle"), { description: t("successDesc") })
      onSubmitted?.()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6"
    >
      <VerificationStepper
        current={currentStep}
        labels={{
          info: tPage("stepper.info"),
          documents: tPage("stepper.documents"),
          review: tPage("stepper.review"),
          approved: tPage("stepper.approved"),
        }}
      />

      {/* Privacy notice */}
      <div className="rounded-xl bg-moroccan-sand-50 border border-moroccan-sand-200 p-3 flex items-start gap-2">
        <Info
          className="size-4 text-moroccan-gold-700 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p className="text-xs text-foreground/80 leading-relaxed">
          {tPage("infoNotice")}
        </p>
      </div>

      {/* Info section */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("companyName")} required>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t("companyPlaceholder")}
              minLength={2}
              maxLength={120}
              required
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label={t("managerName")} required>
            <Input
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder={t("managerPlaceholder")}
              minLength={2}
              maxLength={80}
              required
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label={t("rcNumber")} required>
            <Input
              value={rcNumber}
              onChange={(e) => setRcNumber(e.target.value.replace(/\D/g, ""))}
              placeholder={t("rcPlaceholder")}
              inputMode="numeric"
              minLength={1}
              maxLength={30}
              required
              className="h-11 rounded-xl tabular-nums"
            />
          </Field>
          <Field label={t("professionalPhone")} required>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              minLength={8}
              maxLength={40}
              required
              className="h-11 rounded-xl"
            />
          </Field>
        </div>
        <Field label={t("address")} required>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("addressPlaceholder")}
            minLength={10}
            maxLength={500}
            rows={2}
            required
            className="rounded-xl"
          />
        </Field>
      </section>

      {/* Documents section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DocumentUpload
          label={t("rcDocument")}
          help={t("rcDocumentHelp")}
          prefix="rc"
          userId={userId}
          value={rcDocument}
          onChange={setRcDocument}
          required
        />
        <DocumentUpload
          label={t("idCard")}
          help={t("idCardHelp")}
          prefix="id"
          userId={userId}
          value={idCard}
          onChange={setIdCard}
          required
        />
      </section>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending || !infoReady || !docsReady}
          className="inline-flex items-center justify-center gap-2 h-11 w-full md:w-auto px-6 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="size-4" aria-hidden="true" />
          {pending ? t("submitting") : t("submit")}
        </button>
        <p className="mt-3 text-xs text-muted-foreground">
          {tPage("reviewTimeline")}
        </p>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ms-1">*</span>}
      </Label>
      {children}
    </div>
  )
}

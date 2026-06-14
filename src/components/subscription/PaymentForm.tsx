"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, File as FileIcon, Info, Loader2, Send, Upload } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { requestUpgrade } from "@/app/[locale]/dashboard/upgrade/actions"
import { Link } from "@/i18n/navigation"
import { CopyButton } from "@/components/subscription/CopyButton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadToPrivateBucket } from "@/lib/storage/upload-private"
import { formatPrice } from "@/lib/utils/format"
import {
  MAX_VERIFICATION_BYTES,
  VERIFICATION_MIME_TYPES,
} from "@/lib/validations/verification"
import type { Plan, BankSettings } from "@/lib/queries/subscriptions"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

const ACCEPT = VERIFICATION_MIME_TYPES.join(",")

type Props = {
  plan: Plan
  bank: BankSettings
  userId: string
}

type ReceiptPointer = { path: string; filename: string }

export function PaymentForm({ plan, bank, userId }: Props) {
  const t = useTranslations("subscription.payment")
  const locale = useLocale() as Locale
  const planName = locale === "ar" && plan.name_ar ? plan.name_ar : plan.name

  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptPointer | null>(null)
  const [bankReference, setBankReference] = useState("")
  const [notes, setNotes] = useState("")
  const [done, setDone] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const missingBank = !bank.bank_name || !bank.rib

  async function handleReceiptChange(file: File) {
    setFileError(null)
    if (!VERIFICATION_MIME_TYPES.includes(file.type as never)) {
      setFileError(t("errorTitle"))
      return
    }
    if (file.size > MAX_VERIFICATION_BYTES) {
      setFileError(t("errorTitle"))
      return
    }
    setUploading(true)
    try {
      const result = await uploadToPrivateBucket("receipts", file, {
        userId,
        prefix: "receipt",
      })
      setReceipt({ path: result.path, filename: result.filename })
    } catch (err) {
      setFileError(err instanceof Error ? err.message : t("errorTitle"))
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!receipt) return
    startTransition(async () => {
      const result = await requestUpgrade({
        planId: plan.id,
        receiptPath: receipt.path,
        bankReference: bankReference.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      if (!result.ok) {
        toast.error(t("errorTitle"), {
          description:
            result.error === "already_pending" ? t("alreadyPending") : result.error,
        })
        return
      }
      toast.success(t("successTitle"), { description: t("successDesc") })
      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-moroccan-mint-500/40 bg-moroccan-mint-500/5 p-8 text-center space-y-4">
        <CheckCircle2
          className="mx-auto size-12 text-moroccan-mint-500"
          aria-hidden="true"
        />
        <h2 className="font-display text-2xl font-bold text-foreground">
          {t("successTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("successDesc")}</p>
        <Link
          href="/subscription"
          className="inline-flex items-center h-10 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
        >
          ←
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      {/* Left: bank info + form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Security notice */}
        <div className="rounded-xl bg-moroccan-sand-50 border border-moroccan-sand-200 p-3 flex items-start gap-2">
          <Info
            className="size-4 text-moroccan-gold-700 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-xs text-foreground/80 leading-relaxed">
            {t("secureNotice")}
          </p>
        </div>

        {/* Bank info */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
          <h2 className="font-semibold text-foreground">{t("bankTitle")}</h2>

          {missingBank ? (
            <p className="text-sm text-destructive">{t("missingBankSettings")}</p>
          ) : (
            <dl className="space-y-3">
              {bank.bank_name && (
                <BankRow label={t("bankName")} value={bank.bank_name} />
              )}
              <BankRow label={t("rib")} value={bank.rib} mono />
              <BankRow label={t("beneficiary")} value={bank.beneficiary} />
              <BankRow
                label={t("amount")}
                value={`${formatPrice(plan.price, locale)}`}
                emphasize
              />
            </dl>
          )}

          <p className="text-xs text-muted-foreground">{t("ribNote")}</p>
        </section>

        {/* Form */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
          <h2 className="font-semibold text-foreground">{t("formTitle")}</h2>

          {/* Receipt upload */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {t("receipt")}<span className="text-destructive ms-1">*</span>
            </Label>
            {receipt ? (
              <div className="flex items-center gap-3 rounded-2xl border border-moroccan-mint-500/30 bg-moroccan-mint-500/5 p-4">
                <FileIcon
                  className="size-5 text-moroccan-mint-500 shrink-0"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {receipt.filename}
                  </p>
                  <p className="text-xs text-moroccan-mint-500">✓</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  className="text-xs text-destructive hover:underline"
                >
                  ×
                </button>
              </div>
            ) : (
              <label
                className={cn(
                  "flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-dashed border-moroccan-gold-500/40 bg-moroccan-sand-50/40 cursor-pointer hover:border-moroccan-gold-500 transition-colors",
                  uploading && "opacity-60 pointer-events-none",
                )}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="size-4" aria-hidden="true" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {t("receiptHelp")}
                </span>
                <input
                  type="file"
                  accept={ACCEPT}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void handleReceiptChange(f)
                    e.target.value = ""
                  }}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bankRef" className="text-sm font-medium">
              {t("bankReference")}
              <span className="ms-1 text-xs font-normal text-muted-foreground">
                {t("optional")}
              </span>
            </Label>
            <Input
              id="bankRef"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              placeholder={t("bankReferencePlaceholder")}
              maxLength={120}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium">
              {t("notes")}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
              maxLength={2000}
              className="rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={pending || uploading || !receipt || missingBank}
            className="inline-flex items-center justify-center gap-2 h-11 w-full md:w-auto px-6 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            <Send className="size-4" aria-hidden="true" />
            {pending ? t("submitting") : t("submit")}
          </button>
        </section>
      </form>

      {/* Right: plan summary */}
      <aside className="rounded-2xl border border-moroccan-gold-500/30 bg-moroccan-gold-50/30 p-6 shadow-card space-y-4 lg:sticky lg:top-24 lg:self-start">
        <h3 className="font-semibold text-foreground">{t("summaryTitle")}</h3>
        <div className="space-y-1">
          <p className="font-display text-xl font-bold text-foreground">
            {planName}
          </p>
          <p className="text-xs text-muted-foreground">
            {plan.duration_days} {locale === "ar" ? "يوم" : "jours"}
          </p>
        </div>

        <div className="pt-3 border-t border-moroccan-gold-500/30 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("summaryAmount")}
          </p>
          <p className="font-display text-3xl font-bold text-moroccan-red-500 tabular-nums">
            {formatPrice(plan.price, locale)}
          </p>
        </div>
      </aside>
    </div>
  )
}

function BankRow({
  label,
  value,
  mono = false,
  emphasize = false,
}: {
  label: string
  value: string
  mono?: boolean
  emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0 last:pb-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            "text-sm font-medium text-foreground truncate",
            mono && "font-mono tabular-nums",
            emphasize && "text-moroccan-red-500 font-bold",
          )}
        >
          {value}
        </span>
        {value && <CopyButton value={value} />}
      </dd>
    </div>
  )
}

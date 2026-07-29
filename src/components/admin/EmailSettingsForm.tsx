"use client"

import { useState, useTransition } from "react"
import { AlertCircle, Send } from "lucide-react"
import { toast } from "sonner"

import {
  saveEmailSettings,
  sendTestEmailAction,
} from "@/app/[locale]/admin/settings/email/actions"
import { MoroccanButton } from "@/components/ui/MoroccanButton"

type EmailType =
  | "welcome"
  | "annonce_pending"
  | "annonce_approved"
  | "annonce_rejected"
  | "contact_notification"
  | "report_notification"
  | "newsletter"

type Settings = {
  from: string
  replyTo: string
  enabled: Record<EmailType, boolean>
  adminEmail: string
}

const ALL_TYPES: { key: EmailType; ar: string; fr: string }[] = [
  { key: "welcome", ar: "إيميل الترحيب", fr: "E-mail de bienvenue" },
  { key: "annonce_pending", ar: "إعلان قيد المراجعة", fr: "Annonce en revue" },
  { key: "annonce_approved", ar: "إعلان مقبول", fr: "Annonce approuvée" },
  { key: "annonce_rejected", ar: "إعلان مرفوض", fr: "Annonce rejetée" },
  { key: "contact_notification", ar: "إشعار رسالة تواصل (أدمن)", fr: "Notification contact (admin)" },
  { key: "report_notification", ar: "إشعار بلاغ (أدمن)", fr: "Notification signalement (admin)" },
  { key: "newsletter", ar: "النشرة الإخبارية", fr: "Newsletter" },
]

type Props = {
  locale: string
  initial: Settings
  resendConfigured: boolean
}

export function EmailSettingsForm({
  locale,
  initial,
  resendConfigured,
}: Props) {
  const ar = locale === "ar"
  const [from, setFrom] = useState(initial.from)
  const [replyTo, setReplyTo] = useState(initial.replyTo)
  const [enabled, setEnabled] = useState<Record<EmailType, boolean>>(
    initial.enabled,
  )
  const [testTo, setTestTo] = useState("")
  const [resendKey, setResendKey] = useState("")
  const [savingPending, startSaving] = useTransition()
  const [testingPending, startTesting] = useTransition()

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startSaving(async () => {
      const res = await saveEmailSettings({
        from,
        replyTo,
        enabled,
        resend_key: resendKey,
      })
      if (!res.ok) {
        toast.error(ar ? "تعذّر الحفظ" : "Échec de l'enregistrement")
        return
      }
      setResendKey("")
      toast.success(ar ? "تم الحفظ" : "Enregistré")
    })
  }

  function onTest() {
    if (!testTo) return
    startTesting(async () => {
      const res = await sendTestEmailAction({ to: testTo })
      if (!res.ok) {
        toast.error(ar ? "تعذّر الإرسال" : "Échec de l'envoi", {
          description: res.error,
        })
        return
      }
      toast.success(
        ar ? `تم إرسال إيميل تجريبي إلى ${testTo}` : `E-mail test envoyé à ${testTo}`,
      )
    })
  }

  return (
    <div className="space-y-8">
      {!resendConfigured && (
        <div className="rounded-2xl border border-moroccan-gold-500/40 bg-moroccan-gold-50/60 p-4 flex gap-3 items-start">
          <AlertCircle
            className="size-5 text-moroccan-gold-700 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="text-sm text-foreground">
            <strong>
              {ar
                ? "مفتاح Resend غير معدّ"
                : "Clé Resend non configurée"}
            </strong>
            <p className="mt-1 text-muted-foreground">
              {ar
                ? "أدخل مفتاح Resend API في الحقل أدناه واحفظ. حتى ذلك الحين سيتم تخطّي الإرسال بصمت."
                : "Saisissez la clé API Resend dans le champ ci-dessous et enregistrez. D'ici là, les envois sont silencieusement ignorés."}
            </p>
          </div>
        </div>
      )}

      {/* From / Reply-To */}
      <form
        onSubmit={onSave}
        className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5"
      >
        <h2 className="font-display text-lg font-bold text-foreground">
          {ar ? "المُرسل" : "Expéditeur"}
        </h2>

        <Field
          label={ar ? "From (اسم + إيميل)" : "From (nom + e-mail)"}
          hint='autobladi <noreply@autobladi.ma>'
        >
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputCls}
            required
          />
        </Field>

        <Field
          label="Reply-To"
          hint={ar ? "اختياري — يستقبل ردود المستخدمين" : "Optionnel — reçoit les réponses"}
        >
          <input
            type="email"
            value={replyTo}
            onChange={(e) => setReplyTo(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field
          label={ar ? "مفتاح Resend API" : "Clé API Resend"}
          hint={
            resendConfigured
              ? ar
                ? "مفتاح محفوظ — اتركه فارغاً للإبقاء عليه. يُحفظ بشكل آمن."
                : "Clé enregistrée — laissez vide pour la conserver. Stockée de façon sécurisée."
              : ar
                ? "الصق مفتاح Resend (re_…) لتفعيل إرسال البريد."
                : "Collez votre clé Resend (re_…) pour activer l'envoi d'e-mails."
          }
        >
          <input
            type="password"
            autoComplete="off"
            value={resendKey}
            onChange={(e) => setResendKey(e.target.value)}
            placeholder={resendConfigured ? "•••••••• (محفوظ)" : "re_…"}
            maxLength={500}
            className={`${inputCls} font-mono`}
          />
        </Field>

        <h2 className="font-display text-lg font-bold text-foreground pt-2">
          {ar ? "أنواع الإيميل المفعّلة" : "Types d'e-mail activés"}
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ALL_TYPES.map((t) => (
            <li
              key={t.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
            >
              <span className="text-sm text-foreground truncate">
                {ar ? t.ar : t.fr}
              </span>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled[t.key] ?? true}
                  onChange={(e) =>
                    setEnabled((prev) => ({
                      ...prev,
                      [t.key]: e.target.checked,
                    }))
                  }
                  className="size-4 accent-moroccan-red-500"
                />
              </label>
            </li>
          ))}
        </ul>

        <div className="flex justify-end pt-2">
          <MoroccanButton type="submit" loading={savingPending}>
            {savingPending
              ? ar
                ? "جاري الحفظ..."
                : "Enregistrement..."
              : ar
                ? "حفظ الإعدادات"
                : "Enregistrer"}
          </MoroccanButton>
        </div>
      </form>

      {/* Test send */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
        <h2 className="font-display text-lg font-bold text-foreground">
          {ar ? "إرسال إيميل تجريبي" : "Envoi d'un e-mail test"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {ar
            ? "سيُرسَل إيميل ترحيب تجريبي إلى العنوان أدناه باستخدام الإعدادات المحفوظة."
            : "Un e-mail de bienvenue test sera envoyé à l'adresse ci-dessous avec les paramètres enregistrés."}
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="test@example.com"
            className={inputCls}
          />
          <button
            type="button"
            onClick={onTest}
            disabled={!testTo || testingPending || !resendConfigured}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-moroccan-gold-500 text-brand-dark text-sm font-semibold hover:bg-moroccan-gold-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="size-4" aria-hidden="true" />
            {testingPending
              ? ar
                ? "جاري الإرسال..."
                : "Envoi..."
              : ar
                ? "إرسال تجريبي"
                : "Envoyer test"}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputCls =
  "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  )
}

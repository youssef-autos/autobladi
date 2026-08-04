"use client"

import { useState, useTransition } from "react"
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  changeMyPassword,
  deleteMyAccount,
  requestEmailChange,
  updateMyProfile,
} from "@/app/[locale]/dashboard/compte/actions"
import { useRouter } from "@/i18n/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Combobox } from "@/components/ui/combobox"
import { Field } from "@/components/ui/Field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { uploadWithWatermark } from "@/lib/storage/upload"
import type { DashboardProfile } from "@/lib/queries/dashboard"
import type { City } from "@/lib/queries/home"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  initial: DashboardProfile
  email: string
  cities: City[]
  /** Show the "delete account" danger zone. Hidden for the admin self-page. */
  showDanger?: boolean
}

function initials(name?: string | null): string {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

/** Maps a short error code returned by a server action to translated text. */
function errorMessage(t: ReturnType<typeof useTranslations>, code: string): string {
  if (code === "wrong_password") return t("errorWrongPassword")
  if (code === "same_email") return t("errorSameEmail")
  return t("errorGeneric")
}

export function CompteForm({ initial, email, cities, showDanger = true }: Props) {
  const t = useTranslations("dashboard.comptePage")
  const locale = useLocale() as Locale
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [fullName, setFullName] = useState(initial.full_name ?? "")
  const [phone, setPhone] = useState(initial.phone ?? "")
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp ?? "")
  const [city, setCity] = useState(initial.city ?? "")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState("")
  const [deleting, startDeleting] = useTransition()

  const cityItems = cities.map((c) => {
    const label = locale === "ar" ? c.name_ar : c.name_fr
    return { value: label, label }
  })

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const { mainUrl } = await uploadWithWatermark(file)
      setAvatarUrl(mainUrl)
    } catch {
      toast.error(t("errorGeneric"))
    } finally {
      setUploadingAvatar(false)
      e.target.value = ""
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateMyProfile({
        full_name: fullName,
        phone: phone || null,
        whatsapp: whatsapp || null,
        city: city || null,
        avatar_url: avatarUrl,
      })
      if (!res.ok) {
        toast.error(t("errorGeneric"), { description: res.error })
        return
      }
      toast.success(t("savedTitle"), { description: t("savedDesc") })
    })
  }

  function handleDelete() {
    startDeleting(async () => {
      const res = await deleteMyAccount(deleteText)
      if (!res.ok) {
        toast.error(t("deleteError"), { description: res.error })
        return
      }
      toast.success(t("deleted"))
      router.replace("/")
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal info */}
        <section className="rounded-2xl bg-card border border-border p-6 shadow-soft space-y-5">
          <SectionHeading
            icon={UserIcon}
            tone="red"
            title={t("personal")}
            desc={t("personalDesc")}
          />

          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-lg font-semibold">
                {initials(fullName || email)}
              </AvatarFallback>
            </Avatar>
            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-moroccan-sand-50 cursor-pointer">
              <UserIcon className="size-3.5" aria-hidden="true" />
              {uploadingAvatar ? t("uploading") : t("uploadAvatar")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
          </div>

          <Field label={t("fullName")}>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              className="h-11 rounded-xl max-w-md"
            />
          </Field>
        </section>

        {/* Contact info */}
        <section className="rounded-2xl bg-card border border-border p-6 shadow-soft space-y-5">
          <SectionHeading
            icon={Phone}
            tone="gold"
            title={t("contact")}
            desc={t("contactDesc")}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t("phone")}>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 6 00 00 00 00"
                dir="ltr"
                className="h-11 rounded-xl"
              />
            </Field>

            <Field label={t("whatsapp")}>
              <Input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+212 6 00 00 00 00"
                dir="ltr"
                className="h-11 rounded-xl"
              />
            </Field>

            <Field label={t("city")} className="md:col-span-2">
              <Combobox
                items={cityItems}
                value={city}
                onValueChange={setCity}
                placeholder={t("selectCity")}
              />
            </Field>
          </div>
        </section>

        <button
          type="submit"
          disabled={pending || uploadingAvatar}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all disabled:opacity-60"
        >
          <Save className="size-4" aria-hidden="true" />
          {pending ? t("saving") : t("save")}
        </button>
      </form>

      {/* Security */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="size-5 text-moroccan-red-500" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              {t("security")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("securityDesc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmailCard currentEmail={email} />
          <PasswordCard />
        </div>
      </div>

      {showDanger && (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
          <h2 className="font-semibold text-destructive">{t("danger")}</h2>
          <p className="text-sm text-muted-foreground">{t("dangerDesc")}</p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-destructive bg-background text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {t("deleteAccount")}
          </button>
        </section>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
            <DialogDescription>{t("deleteWarning")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="delete-confirm" className="text-sm">
              {t("deleteConfirmInput")}
            </Label>
            <Input
              id="delete-confirm"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="h-11 rounded-xl"
              autoComplete="off"
            />
          </div>
          <Separator />
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false)
                setDeleteText("")
              }}
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
            >
              {t("deleteCancel")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || deleteText !== "DELETE"}
              className={cn(
                "inline-flex items-center justify-center h-10 px-4 rounded-xl bg-destructive text-white text-sm font-semibold hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {t("deleteConfirm")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Security cards
// ---------------------------------------------------------------------------

function EmailCard({ currentEmail }: { currentEmail: string }) {
  const t = useTranslations("dashboard.comptePage")
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await requestEmailChange({
        newEmail: newEmail.trim(),
        currentPassword,
      })
      if (!res.ok) {
        toast.error(errorMessage(t, res.error))
        return
      }
      toast.success(t("emailChangeSentTitle"), {
        description: t("emailChangeSentDesc"),
      })
      setSent(true)
      setNewEmail("")
      setCurrentPassword("")
    })
  }

  const canSubmit = newEmail.trim().length > 3 && currentPassword.length > 0

  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-soft space-y-4">
      <SectionHeading icon={Mail} tone="red" title={t("emailCardTitle")} />

      <Field label={t("currentEmail")}>
        <Input
          value={currentEmail}
          readOnly
          disabled
          dir="ltr"
          className="h-11 rounded-xl bg-muted/40"
        />
      </Field>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("newEmail")}>
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t("newEmailPlaceholder")}
            dir="ltr"
            className="h-11 rounded-xl"
          />
        </Field>

        <PasswordField
          id="email-current-password"
          label={t("currentPasswordForEmail")}
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
        />
        <p className="text-xs text-muted-foreground -mt-2">{t("emailConfirmHelp")}</p>

        {sent && (
          <p className="rounded-xl bg-moroccan-mint-500/10 border border-moroccan-mint-500/30 px-3 py-2 text-xs text-moroccan-mint-600">
            {t("emailChangeSentDesc")}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !canSubmit}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-dark text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="size-4" aria-hidden="true" />
          {pending ? t("changingEmail") : t("changeEmail")}
        </button>
      </form>
    </section>
  )
}

function PasswordCard() {
  const t = useTranslations("dashboard.comptePage")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await changeMyPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      if (!res.ok) {
        toast.error(errorMessage(t, res.error))
        return
      }
      toast.success(t("passwordChangedTitle"), {
        description: t("passwordChangedDesc"),
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    })
  }

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword

  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-soft space-y-4">
      <SectionHeading icon={Lock} tone="gold" title={t("passwordCardTitle")} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          id="account-current-password"
          label={t("currentPassword")}
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PasswordField
            id="new-password"
            label={t("newPassword")}
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm-new-password"
            label={t("confirmNewPassword")}
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-2">{t("passwordMinHelp")}</p>

        <button
          type="submit"
          disabled={pending || !canSubmit}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-dark text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <KeyRound className="size-4" aria-hidden="true" />
          {pending ? t("changingPassword") : t("changePassword")}
        </button>
      </form>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function SectionHeading({
  icon: Icon,
  tone,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>
  tone: "red" | "gold"
  title: string
  desc?: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
          tone === "red"
            ? "bg-moroccan-red-50 text-moroccan-red-500"
            : "bg-moroccan-gold-500/15 text-moroccan-gold-700",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  const t = useTranslations("dashboard.comptePage")
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          dir="ltr"
          className="h-11 rounded-xl pe-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          className="absolute end-2 top-1/2 -translate-y-1/2 inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-moroccan-sand-50"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}


"use client"

import { useState, useTransition } from "react"
import { Save, Trash2, User as UserIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  deleteMyAccount,
  updateMyProfile,
} from "@/app/[locale]/dashboard/compte/actions"
import { Link, useRouter } from "@/i18n/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { uploadWithWatermark } from "@/lib/storage/upload"
import type { DashboardProfile } from "@/lib/queries/dashboard"
import { cn } from "@/lib/utils"

type Props = {
  initial: DashboardProfile
  email: string
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

export function CompteForm({ initial, email, showDanger = true }: Props) {
  const t = useTranslations("dashboard.comptePage")
  const tAuth = useTranslations("auth.signIn")
  const locale = useLocale()
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const { mainUrl } = await uploadWithWatermark(file)
      setAvatarUrl(mainUrl)
    } catch {
      toast.error(t("deleteError"))
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
        toast.error(t("deleteError"), { description: res.error })
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
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl bg-card border border-border p-6 shadow-soft space-y-5">
          <h2 className="font-semibold text-foreground">{t("personal")}</h2>

          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 text-lg font-semibold">
                {initials(fullName || email)}
              </AvatarFallback>
            </Avatar>
            <div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t("fullName")}>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                className="h-11 rounded-xl"
              />
            </Field>

            <Field label={t("email")} help={t("emailHelp")}>
              <Input value={email} readOnly disabled className="h-11 rounded-xl" />
            </Field>

            <Field label={t("phone")}>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 6 00 00 00 00"
                className="h-11 rounded-xl"
              />
            </Field>

            <Field label={t("whatsapp")}>
              <Input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+212 6 00 00 00 00"
                className="h-11 rounded-xl"
              />
            </Field>

            <Field label={t("city")}>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={pending || uploadingAvatar}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all disabled:opacity-60"
          >
            <Save className="size-4" aria-hidden="true" />
            {pending ? t("saving") : t("save")}
          </button>
        </section>

        <section className="rounded-2xl bg-card border border-border p-6 shadow-soft space-y-3">
          <h2 className="font-semibold text-foreground">{t("security")}</h2>
          <Link
            href="/auth/mot-de-passe-oublie"
            className="inline-flex items-center text-sm text-moroccan-red-500 hover:underline"
          >
            {t("changePassword")} →
          </Link>
          <span hidden aria-hidden>
            {locale}
            {tAuth("title")}
          </span>
        </section>
      </form>

      {showDanger && (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 mt-6 space-y-3">
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
    </>
  )
}

function Field({
  label,
  help,
  children,
}: {
  label: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { updateUserProfile } from "@/app/[locale]/admin/users/actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import type { AdminUserRow } from "@/lib/queries/admin"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUserRow
}

export function UserEditDialog({ open, onOpenChange, user }: Props) {
  const t = useTranslations("adminPanel.usersPage")
  const tForm = useTranslations("adminPanel.usersPage.editForm")
  const [pending, startTransition] = useTransition()

  const [fullName, setFullName] = useState(user.full_name ?? "")
  const [phone, setPhone] = useState(user.phone ?? "")
  const [whatsapp, setWhatsapp] = useState(user.whatsapp ?? "")
  const [city, setCity] = useState(user.city ?? "")
  const [accountType, setAccountType] = useState(user.account_type)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const res = await updateUserProfile({
        id: user.id,
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        city: city.trim() || null,
        account_type: accountType,
      })
      if (!res.ok) {
        toast.error(
          res.error === "cant_self" ? t("toast.cantSelf") : t("toast.error"),
        )
        return
      }
      toast.success(t("toast.updated"))
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tForm("title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 mt-2">
          {/* Email — read-only (managed by auth) */}
          {user.email && (
            <Field label={tForm("email")}>
              <input
                type="email"
                value={user.email}
                readOnly
                className={`${inputCls} bg-muted/50 text-muted-foreground`}
              />
            </Field>
          )}

          <Field label={tForm("fullName")}>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={120}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={tForm("phone")}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={40}
                className={inputCls}
              />
            </Field>
            <Field label={tForm("whatsapp")}>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                maxLength={40}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={tForm("city")}>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={80}
                className={inputCls}
              />
            </Field>
            <Field label={tForm("accountType")}>
              <select
                value={accountType}
                onChange={(e) =>
                  setAccountType(e.target.value as typeof accountType)
                }
                className={inputCls}
              >
                <option value="gratuit">{tForm("typeGratuit")}</option>
                <option value="pro">{tForm("typePro")}</option>
                {/* Admin promotion isn't offered; only shown to keep an
                    existing admin selectable. */}
                {user.account_type === "admin" && (
                  <option value="admin">{tForm("typeAdmin")}</option>
                )}
              </select>
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
            >
              {tForm("cancel")}
            </button>
            <MoroccanButton type="submit" size="sm" loading={pending}>
              {pending ? tForm("saving") : tForm("save")}
            </MoroccanButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const inputCls =
  "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}

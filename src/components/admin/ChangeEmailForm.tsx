"use client"

import { useState, useTransition } from "react"
import { Mail, Save } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { changeAdminEmail } from "@/app/[locale]/admin/compte/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  currentEmail: string
}

export function ChangeEmailForm({ currentEmail }: Props) {
  const t = useTranslations("adminPanel.accountPage")
  const [newEmail, setNewEmail] = useState("")
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await changeAdminEmail({ email: newEmail })
      if (!res.ok) {
        const msg =
          res.error === "same_email"
            ? t("emailSame")
            : res.error === "invalid_email"
              ? t("emailInvalid")
              : t("emailError")
        toast.error(msg)
        return
      }
      toast.success(t("emailChanged"))
      setNewEmail("")
    })
  }

  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-soft space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-semibold text-foreground">{t("changeEmailTitle")}</h2>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-muted-foreground">
          {t("currentEmail")}
        </Label>
        <Input
          value={currentEmail}
          readOnly
          disabled
          className="h-11 rounded-xl bg-muted/50"
          dir="ltr"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-email" className="text-sm font-medium">
            {t("newEmail")}
          </Label>
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="nouveau@example.com"
            required
            dir="ltr"
            className="h-11 rounded-xl"
          />
        </div>

        <button
          type="submit"
          disabled={pending || !newEmail.trim()}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-brand-dark text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
        >
          <Save className="size-4" aria-hidden="true" />
          {pending ? t("emailSaving") : t("emailSave")}
        </button>
      </form>
    </section>
  )
}

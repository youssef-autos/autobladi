"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, MessageCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { sendMessage } from "@/app/[locale]/(main)/annonces/[slug]/actions"
import { Link } from "@/i18n/navigation"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

type Props = {
  receiverId: string
  annonceId: string
  trigger?: React.ReactElement
  className?: string
}

export function MessageDialog({ receiverId, annonceId, trigger, className }: Props) {
  const t = useTranslations("annonceDetail.message")
  const { user, loading } = useUser()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    startTransition(async () => {
      const result = await sendMessage({ receiverId, annonceId, content: content.trim() })
      if (!result.ok) {
        toast.error(t(result.error === "auth_required" ? "errorAuth" : "errorGeneric"))
        return
      }
      setDone(true)
      toast.success(t("successTitle"), { description: t("successDesc") })
    })
  }

  const tContact = useTranslations("annonceDetail.contact")
  const defaultTrigger = (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 h-11 w-full rounded-xl border border-border bg-background font-semibold text-foreground hover:bg-moroccan-sand-50",
        className,
      )}
    >
      <MessageCircle className="size-4" aria-hidden="true" />
      {tContact("message")}
    </button>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setDone(false)
          setContent("")
        }
      }}
    >
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        {!loading && !user ? (
          <div className="rounded-xl bg-moroccan-sand-50 p-4 text-sm">
            <p className="text-foreground mb-3">{t("errorAuth")}</p>
            <Link
              href="/auth/connexion"
              className="inline-flex h-10 px-4 items-center justify-center rounded-xl bg-moroccan-gradient text-white text-sm font-semibold hover:brightness-105"
            >
              {t("loginCta")}
            </Link>
          </div>
        ) : done ? (
          <div className="space-y-3 text-center py-4">
            <CheckCircle2 className="mx-auto size-10 text-moroccan-mint-500" aria-hidden="true" />
            <p className="font-medium text-foreground">{t("successTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("successDesc")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("placeholder")}
              required
              minLength={2}
              maxLength={2000}
              rows={5}
              className="rounded-xl"
            />
            <button
              type="submit"
              disabled={pending || content.trim().length < 2}
              className="h-11 w-full rounded-xl bg-moroccan-gradient text-white font-semibold hover:brightness-105 disabled:opacity-60 transition-all"
            >
              {pending ? t("sending") : t("send")}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

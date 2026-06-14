"use client"

import { useState, useTransition } from "react"
import { Send } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { sendNewsletterCampaign } from "@/app/[locale]/admin/newsletter/actions"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  subscriberCount: number
}

export function NewsletterComposer({ subscriberCount }: Props) {
  const t = useTranslations("adminPanel.newsletterPage")
  const [heading, setHeading] = useState("")
  const [introText, setIntroText] = useState("")
  const [itemCount, setItemCount] = useState(6)
  const [pending, startTransition] = useTransition()

  function handleSend() {
    if (heading.trim().length < 3 || introText.trim().length < 3) {
      toast.error(t("toast.invalid"))
      return
    }
    if (subscriberCount === 0) {
      toast.error(t("toast.noSubscribers"))
      return
    }
    if (!window.confirm(t("confirmSend", { count: subscriberCount }))) return

    startTransition(async () => {
      const res = await sendNewsletterCampaign({ heading, introText, itemCount })
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.sent", { sent: res.sent, failed: res.failed }))
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-card space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t("compose")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("composeDesc")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nl-heading" className="text-sm font-medium">
          {t("heading")}
        </Label>
        <input
          id="nl-heading"
          type="text"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder={t("headingPlaceholder")}
          maxLength={150}
          className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nl-intro" className="text-sm font-medium">
          {t("introText")}
        </Label>
        <Textarea
          id="nl-intro"
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          placeholder={t("introTextPlaceholder")}
          rows={4}
          maxLength={1000}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nl-items" className="text-sm font-medium">
          {t("itemCount")}
        </Label>
        <input
          id="nl-items"
          type="number"
          min={0}
          max={12}
          value={itemCount}
          onChange={(e) => setItemCount(Math.max(0, Math.min(12, Number(e.target.value) || 0)))}
          className="w-28 h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"
        />
        <p className="text-xs text-muted-foreground">{t("itemCountHelp")}</p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-border/60">
        <p className="text-xs text-muted-foreground">
          {t("willSendTo", { count: subscriberCount })}
        </p>
        <button
          type="button"
          onClick={handleSend}
          disabled={pending}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 disabled:opacity-60"
        >
          <Send className="size-4" aria-hidden="true" />
          {pending ? t("sending") : t("send")}
        </button>
      </div>
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { Loader2, Send } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { sendDashboardMessage } from "@/app/[locale]/dashboard/messages/actions"
import { cn } from "@/lib/utils"

type Props = {
  conversationId: string
  disabled?: boolean
}

export function MessageInput({ conversationId, disabled = false }: Props) {
  const t = useTranslations("messagesPage.input")
  const tErr = useTranslations("messagesPage.errors")
  const [content, setContent] = useState("")
  const [pending, startTransition] = useTransition()

  function submit() {
    const trimmed = content.trim()
    if (!trimmed || pending) return
    startTransition(async () => {
      const result = await sendDashboardMessage({
        conversationId,
        content: trimmed,
      })
      if (!result.ok) {
        toast.error(tErr("send"))
        return
      }
      setContent("")
    })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-border bg-background p-3 md:p-4">
      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={2000}
          disabled={disabled || pending}
          placeholder={t("placeholder")}
          className={cn(
            "flex-1 min-h-11 max-h-40 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm",
            "focus:outline-none focus:border-moroccan-red-500/40 focus:ring-2 focus:ring-moroccan-red-500/15",
            "placeholder:text-muted-foreground/70",
          )}
          aria-label={t("placeholder")}
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || pending || content.trim().length === 0}
          aria-label={t("send")}
          className="inline-flex items-center justify-center size-11 rounded-xl bg-moroccan-gradient text-white shadow-moroccan hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4 rtl:scale-x-[-1]" aria-hidden="true" />
          )}
        </button>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground hidden md:block">
        {t("hint")}
      </p>
    </div>
  )
}

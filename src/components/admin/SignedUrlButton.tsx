"use client"

import { useState, useTransition } from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

type Action = (
  path: string,
  ttl?: number,
) => Promise<{ ok: true; url: string } | { ok: false; error: string }>

type Props = {
  path: string | null
  fetcher: Action
  label: string
  className?: string
  errorMessage?: string
}

/**
 * Generic button that fetches a short-lived signed URL on click and opens
 * the document in a new tab. Wraps any server action returning the standard
 * `{ ok, url }` shape (verification, receipts, etc.).
 */
export function SignedUrlButton({
  path,
  fetcher,
  label,
  className,
  errorMessage,
}: Props) {
  const tLoading = useTranslations("adminPanel.verificationQueue")
  const [pending, startTransition] = useTransition()
  const [disabled, setDisabled] = useState(false)

  function handleClick() {
    if (!path || pending) return
    startTransition(async () => {
      const result = await fetcher(path)
      if (!result.ok) {
        setDisabled(true)
        toast.error(errorMessage ?? result.error)
        window.setTimeout(() => setDisabled(false), 2000)
        return
      }
      window.open(result.url, "_blank", "noopener,noreferrer")
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!path || pending || disabled}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-moroccan-sand-50 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <ExternalLink className="size-3.5" aria-hidden="true" />
      )}
      {pending ? tLoading("loadingPreview") : label}
    </button>
  )
}

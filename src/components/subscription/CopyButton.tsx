"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

type Props = {
  value: string
  className?: string
  size?: "sm" | "md"
}

export function CopyButton({ value, className, size = "sm" }: Props) {
  const t = useTranslations("subscription.payment")
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Older browsers / blocked clipboard
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? t("copied") : t("copy")}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-foreground font-medium transition-colors hover:bg-moroccan-sand-50",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3 text-sm",
        copied && "border-moroccan-mint-500/40 text-moroccan-mint-500",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      <span>{copied ? t("copied") : t("copy")}</span>
    </button>
  )
}

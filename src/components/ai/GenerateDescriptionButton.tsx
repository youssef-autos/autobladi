"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import type { DescriptionInput } from "@/lib/ai/types"
import { cn } from "@/lib/utils"

type Props = {
  /**
   * Payload for the AI. Pass `null` to disable the button (e.g. when required
   * fields are missing further up the form).
   */
  carData: DescriptionInput | null
  onResult: (text: string) => void
  className?: string
  /** Optional label override. Defaults to the wizard's translation. */
  label?: string
}

export function GenerateDescriptionButton({
  carData,
  onResult,
  className,
  label,
}: Props) {
  const t = useTranslations("ajouter.step2")
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (!carData || pending) return
    setPending(true)
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(carData),
      })
      if (res.status === 429) {
        const data = (await res.json().catch(() => null)) as
          | { retryAfter?: number }
          | null
        const retry = data?.retryAfter ?? 60
        toast.error(t("aiError"), {
          description: `Rate limited — retry in ${Math.ceil(retry / 60)} min`,
        })
        return
      }
      if (!res.ok) {
        toast.error(t("aiError"))
        return
      }
      const data = (await res.json()) as { description?: string }
      if (!data.description) {
        toast.error(t("aiError"))
        return
      }
      onResult(data.description)
    } catch {
      toast.error(t("aiError"))
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || !carData}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl h-9 px-3 text-sm font-medium",
        "bg-moroccan-gold-50 text-moroccan-gold-700 border border-moroccan-gold-500/40",
        "hover:bg-moroccan-gold-100 hover:border-moroccan-gold-500 transition-colors",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Sparkles className="size-4" aria-hidden="true" />
      )}
      {label ?? (pending ? t("aiGenerating") : t("aiGenerate"))}
    </button>
  )
}

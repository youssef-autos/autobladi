"use client"

import { useState, useTransition } from "react"
import { Flag } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { reportAnnonce } from "@/app/[locale]/(main)/annonces/[slug]/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Props = {
  annonceId: string
  trigger?: React.ReactElement
  className?: string
}

const REASONS = [
  "fake",
  "scam",
  "wrong_category",
  "sold",
  "inappropriate",
  "other",
] as const

export function ReportDialog({ annonceId, trigger, className }: Props) {
  const t = useTranslations("annonceDetail.report")
  const tContact = useTranslations("annonceDetail.contact")
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<(typeof REASONS)[number]>("fake")
  const [description, setDescription] = useState("")
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await reportAnnonce({
        annonceId,
        reason,
        description: description.trim() || undefined,
      })
      if (!result.ok) {
        toast.error(t("errorGeneric"))
        return
      }
      toast.success(t("successTitle"), { description: t("successDesc") })
      setOpen(false)
      setDescription("")
      setReason("fake")
    })
  }

  const defaultTrigger = (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors",
        className,
      )}
    >
      <Flag className="size-3.5" aria-hidden="true" />
      {tContact("report")}
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset>
            <legend className="text-sm font-medium mb-2">{t("reason")}</legend>
            <RadioGroup
              value={reason}
              onValueChange={(v) => v && setReason(v as (typeof REASONS)[number])}
              className="grid grid-cols-1 gap-1"
            >
              {REASONS.map((r) => (
                <Label
                  key={r}
                  htmlFor={`reason-${r}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer text-sm hover:bg-moroccan-sand-50"
                >
                  <RadioGroupItem value={r} id={`reason-${r}`} />
                  {t(`reasons.${r}`)}
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="report-desc" className="text-sm font-medium">
              {t("description")}
            </Label>
            <Textarea
              id="report-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              className="rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-xl bg-moroccan-gradient text-white font-semibold hover:brightness-105 disabled:opacity-60 transition-all"
          >
            {pending ? t("submitting") : t("submit")}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

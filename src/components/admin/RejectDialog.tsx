"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  reasonLabel: string
  placeholder?: string
  pending?: boolean
  onConfirm: (reason: string) => void
}

export function RejectDialog({
  open,
  onOpenChange,
  title,
  reasonLabel,
  placeholder,
  pending = false,
  onConfirm,
}: Props) {
  const t = useTranslations("adminPanel.annoncesQueue")
  const [reason, setReason] = useState("")

  function handleClose(next: boolean) {
    if (!next) setReason("")
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-sm font-medium">{reasonLabel}</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder}
            minLength={3}
            maxLength={500}
            rows={4}
            required
            className="rounded-xl"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => handleClose(false)}
            disabled={pending}
            className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-border bg-background text-sm font-medium hover:bg-moroccan-sand-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={pending || reason.trim().length < 3}
            className={cn(
              "inline-flex items-center justify-center h-10 px-4 rounded-xl bg-destructive text-white text-sm font-semibold hover:brightness-105 disabled:opacity-50",
            )}
          >
            {t("confirmReject")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

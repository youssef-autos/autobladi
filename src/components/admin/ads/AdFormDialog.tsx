"use client"

import { useState, useTransition } from "react"
import { ImagePlus, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  createAd,
  updateAd,
  uploadAdImage,
} from "@/app/[locale]/admin/ads/actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import type { AdminAdRow, AdminPlacementRow } from "@/lib/queries/admin"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  placements: AdminPlacementRow[]
  initial?: AdminAdRow | null
}

/** Wrapper that remounts the inner form on every switch to reset state. */
export function AdFormDialog({ open, onOpenChange, placements, initial }: Props) {
  const t = useTranslations("adminPanel.adsPage")
  const isEdit = !!initial
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("form.edit") : t("form.new")}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <InnerForm
            key={initial?.id ?? "new"}
            initial={initial ?? null}
            placements={placements}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function InnerForm({
  initial,
  placements,
  onClose,
}: {
  initial: AdminAdRow | null
  placements: AdminPlacementRow[]
  onClose: () => void
}) {
  const t = useTranslations("adminPanel.adsPage")
  const tForm = useTranslations("adminPanel.adsPage.form")
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState(initial?.title ?? "")
  const [placementId, setPlacementId] = useState(initial?.placement_id ?? placements[0]?.id ?? "")
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "")
  const [linkUrl, setLinkUrl] = useState(initial?.link_url ?? "")
  const [startsAt, setStartsAt] = useState(
    initial?.starts_at ? initial.starts_at.slice(0, 10) : "",
  )
  const [endsAt, setEndsAt] = useState(
    initial?.ends_at ? initial.ends_at.slice(0, 10) : "",
  )
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [uploading, setUploading] = useState(false)

  const isEdit = !!initial
  const selectedPlacement = placements.find((p) => p.id === placementId)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("toast.uploadFailed"), { description: "Max 5 MB" })
      return
    }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const res = await uploadAdImage(dataUrl, file.name)
      setUploading(false)
      if (!res.ok || !res.data) {
        toast.error(t("toast.uploadFailed"))
        return
      }
      setImageUrl(res.data.url)
    }
    reader.readAsDataURL(file)
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!imageUrl) {
      toast.error(tForm("image"))
      return
    }
    const payload = {
      placement_id: placementId,
      title: title.trim(),
      image_url: imageUrl,
      link_url: linkUrl.trim() || null,
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      is_active: isActive,
    }
    startTransition(async () => {
      const res = isEdit
        ? await updateAd({ ...payload, id: initial!.id })
        : await createAd(payload)
      if (!res.ok) {
        toast.error(t("toast.error"), { description: res.error })
        return
      }
      toast.success(isEdit ? t("toast.updated") : t("toast.created"))
      onClose()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      {/* Placement */}
      <Field label={tForm("placement")}>
        <select
          value={placementId}
          onChange={(e) => setPlacementId(e.target.value)}
          required
          className={inputCls}
        >
          <option value="" disabled>
            {tForm("placementPlaceholder")}
          </option>
          {placements.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.width && p.height ? `(${p.width}×${p.height}px)` : ""}
            </option>
          ))}
        </select>
        {selectedPlacement && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {selectedPlacement.description}
          </p>
        )}
      </Field>

      {/* Title */}
      <Field label={tForm("title")}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={tForm("titlePlaceholder")}
          required
          maxLength={200}
          className={inputCls}
        />
      </Field>

      {/* Image upload */}
      <Field label={tForm("image")} hint={tForm("imageHelp")}>
        {imageUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="w-full max-h-40 object-contain rounded-xl border border-border bg-moroccan-sand-50"
            />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="absolute top-1.5 end-1.5 inline-flex items-center justify-center size-7 rounded-full bg-black/55 text-white hover:bg-black/70"
              aria-label="Remove image"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-moroccan-gold-500/40 bg-moroccan-gold-50/30 p-6 cursor-pointer hover:bg-moroccan-gold-50/60 transition-colors">
            <ImagePlus
              className="size-8 text-moroccan-gold-600"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-foreground">
              {uploading ? tForm("imageUploading") : tForm("imageUpload")}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        )}
      </Field>

      {/* Link URL */}
      <Field label={tForm("linkUrl")}>
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder={tForm("linkUrlPlaceholder")}
          maxLength={500}
          className={inputCls}
        />
      </Field>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-4">
        <Field label={tForm("startsAt")}>
          <input
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={tForm("endsAt")}>
          <input
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="size-5 accent-moroccan-red-500"
        />
        <span className="text-sm font-medium text-foreground">
          {tForm("isActive")}
        </span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending || uploading}
          className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
        >
          {tForm("cancel")}
        </button>
        <MoroccanButton
          type="submit"
          size="sm"
          loading={pending || uploading}
          disabled={!imageUrl}
        >
          {pending ? tForm("saving") : tForm("save")}
        </MoroccanButton>
      </div>
    </form>
  )
}

const inputCls =
  "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  )
}

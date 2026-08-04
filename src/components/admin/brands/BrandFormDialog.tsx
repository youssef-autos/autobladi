"use client"

import { useRef, useState, useTransition } from "react"
import { Loader2, Upload, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  createBrand,
  updateBrand,
} from "@/app/[locale]/admin/brands/actions"
import { uploadBrandLogo } from "@/app/[locale]/admin/brands/upload-action"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/Field"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { mediaUrl } from "@/lib/media"
import { slugify } from "@/lib/validations/brand"
import type { AdminBrandRow } from "@/lib/queries/admin"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: AdminBrandRow | null
}

export function BrandFormDialog({ open, onOpenChange, initial }: Props) {
  const t = useTranslations("adminPanel.brandsPage")
  const tForm = useTranslations("adminPanel.brandsPage.form")
  const isEdit = !!initial

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? tForm("edit") : t("addManual")}</DialogTitle>
        </DialogHeader>
        {open && (
          <InnerForm
            key={initial?.id ?? "new"}
            initial={initial ?? null}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function InnerForm({
  initial,
  onClose,
}: {
  initial: AdminBrandRow | null
  onClose: () => void
}) {
  const t = useTranslations("adminPanel.brandsPage")
  const tForm = useTranslations("adminPanel.brandsPage.form")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState(initial?.name ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "")
  const [orderIndex, setOrderIndex] = useState(initial?.order_index ?? 0)
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const isEdit = !!initial

  function onNameChange(v: string) {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await uploadBrandLogo(fd)
      if (!res.ok) { toast.error(`Erreur: ${res.error}`); return }
      setLogoUrl(res.url)
      toast.success("Logo téléchargé ✓")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const payload = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      logo_url: logoUrl.trim() || null,
      order_index: orderIndex,
      is_active: isActive,
    }
    startTransition(async () => {
      const res = isEdit
        ? await updateBrand({ ...payload, id: initial!.id })
        : await createBrand(payload)
      if (!res.ok) {
        toast.error(res.error === "slug_taken" ? "Slug already used" : t("toast.error"))
        return
      }
      toast.success(isEdit ? t("toast.updated") : t("toast.created"))
      onClose()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      {/* Logo 125×125 */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          {tForm("logoUrl")}
          <span className="ms-1 text-xs font-normal text-muted-foreground">— 125×125 px</span>
        </legend>

        <div className="flex items-start gap-4">
          {/* Preview 125×125 — key forces remount when URL changes */}
          <span className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-moroccan-sand-50 overflow-hidden"
            style={{ width: 125, height: 125 }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={logoUrl}
                src={mediaUrl(logoUrl)}
                alt="logo"
                loading="eager"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span className="text-3xl text-muted-foreground/40 font-bold select-none">
                {name[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </span>

          <div className="flex flex-col gap-2 flex-1">
            {/* Upload button */}
            <button type="button" disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-dashed border-moroccan-gold-500/60 bg-moroccan-gold-50/40 text-xs font-medium text-moroccan-gold-700 hover:bg-moroccan-gold-50 disabled:opacity-60">
              {uploading
                ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                : <Upload className="size-3.5" aria-hidden="true" />}
              {uploading ? "Envoi..." : "Télécharger"}
            </button>

            {/* Clear */}
            {logoUrl && (
              <button type="button" onClick={() => setLogoUrl("")}
                className="inline-flex items-center gap-1 text-xs text-moroccan-red-500 hover:underline w-fit">
                <X className="size-3" />
                Supprimer
              </button>
            )}

            {/* URL field */}
            <input type="text" value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              maxLength={1000}
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground">{tForm("logoUrlHelp")}</p>

            <input ref={fileInputRef} type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleUpload(f)
                e.target.value = ""
              }} />
          </div>
        </div>
      </fieldset>

      <Field label={tForm("name")}>
        <input type="text" value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={tForm("namePlaceholder")}
          required minLength={1} maxLength={80} className={inputCls} />
      </Field>

      <Field label={tForm("slug")} help={tForm("slugHelp")}>
        <input type="text" value={slug}
          onChange={(e) => { setSlugTouched(true); setSlug(e.target.value) }}
          placeholder={tForm("slugPlaceholder")}
          pattern="^[a-z0-9-]+$" required className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={tForm("orderIndex")} help={tForm("orderIndexHelp")}>
          <input type="number" value={orderIndex}
            onChange={(e) => setOrderIndex(Number(e.target.value) || 0)}
            min={0} max={9999} className={inputCls} />
        </Field>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">{tForm("isActive")}</span>
          <label className="inline-flex items-center gap-2 h-11 cursor-pointer">
            <input type="checkbox" checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-5 accent-moroccan-red-500" />
            <span className="text-sm text-muted-foreground">{tForm("isActiveHelp")}</span>
          </label>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} disabled={pending}
          className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-moroccan-sand-50">
          {tForm("cancel")}
        </button>
        <MoroccanButton type="submit" size="sm" loading={pending}>
          {pending ? tForm("saving") : tForm("save")}
        </MoroccanButton>
      </div>
    </form>
  )
}

const inputCls =
  "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"


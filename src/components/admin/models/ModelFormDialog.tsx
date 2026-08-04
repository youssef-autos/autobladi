"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  createModel,
  updateModel,
} from "@/app/[locale]/admin/models/actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/Field"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { slugify } from "@/lib/validations/model"
import type { AdminBrandRow, AdminModelRow } from "@/lib/queries/admin"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  brands: AdminBrandRow[]
  initial?: AdminModelRow | null
  /** Pre-selected brand for the create form (from filter chips). */
  defaultBrandId?: string | null
}

/**
 * Wrapper that keys the inner form on the model id so React fully remounts
 * it on every switch between create / different rows — avoids the
 * setState-in-effect anti-pattern banned by React 19.
 */
export function ModelFormDialog({
  open,
  onOpenChange,
  brands,
  initial,
  defaultBrandId,
}: Props) {
  const t = useTranslations("adminPanel.modelsPage")
  const tForm = useTranslations("adminPanel.modelsPage.form")
  const isEdit = !!initial

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? tForm("edit") : t("addManual")}
          </DialogTitle>
        </DialogHeader>

        {open && (
          <InnerForm
            key={initial?.id ?? "new"}
            initial={initial ?? null}
            brands={brands}
            defaultBrandId={defaultBrandId ?? null}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function InnerForm({
  initial,
  brands,
  defaultBrandId,
  onClose,
}: {
  initial: AdminModelRow | null
  brands: AdminBrandRow[]
  defaultBrandId: string | null
  onClose: () => void
}) {
  const t = useTranslations("adminPanel.modelsPage")
  const tForm = useTranslations("adminPanel.modelsPage.form")
  const [pending, startTransition] = useTransition()
  const [brandId, setBrandId] = useState(
    initial?.brand_id ?? defaultBrandId ?? brands[0]?.id ?? "",
  )
  const [name, setName] = useState(initial?.name ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [slugTouched, setSlugTouched] = useState(!!initial)

  const isEdit = !!initial

  if (brands.length === 0) {
    return (
      <div className="rounded-xl bg-moroccan-gold-50/40 border border-moroccan-gold-500/30 p-4 text-sm text-foreground">
        {tForm("noBrands")}
      </div>
    )
  }

  function onNameChange(v: string) {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      brand_id: brandId,
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      is_active: isActive,
    }
    startTransition(async () => {
      const res = isEdit
        ? await updateModel({ ...payload, id: initial!.id })
        : await createModel(payload)
      if (!res.ok) {
        const msg =
          res.error === "slug_taken"
            ? t("toast.slugTaken")
            : res.error === "brand_not_found"
              ? t("toast.brandNotFound")
              : t("toast.error")
        toast.error(msg)
        return
      }
      toast.success(isEdit ? t("toast.updated") : t("toast.created"))
      onClose()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <Field label={tForm("brand")}>
        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          required
          disabled={isEdit}
          className={inputCls}
        >
          <option value="" disabled>
            {tForm("brandPlaceholder")}
          </option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={tForm("name")}>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={tForm("namePlaceholder")}
          required
          minLength={1}
          maxLength={80}
          className={inputCls}
        />
      </Field>

      <Field label={tForm("slug")} help={tForm("slugHelp")}>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          placeholder={tForm("slugPlaceholder")}
          pattern="^[a-z0-9-]+$"
          required
          className={inputCls}
        />
      </Field>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="size-5 accent-moroccan-red-500"
        />
        <span className="text-sm text-foreground">{tForm("isActive")}</span>
        <span className="text-xs text-muted-foreground">
          — {tForm("isActiveHelp")}
        </span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
        >
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
  "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60 disabled:opacity-60 disabled:cursor-not-allowed"


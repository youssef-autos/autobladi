"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  createBlogCategory,
  updateBlogCategory,
} from "@/app/[locale]/admin/blog/categories/actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { slugify } from "@/lib/validations/blog-category"
import type { AdminBlogCategoryRow } from "@/lib/queries/admin"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: AdminBlogCategoryRow | null
}

export function BlogCategoryFormDialog({ open, onOpenChange, initial }: Props) {
  const t = useTranslations("adminPanel.blogCategoriesPage")
  const tForm = useTranslations("adminPanel.blogCategoriesPage.form")
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
  initial: AdminBlogCategoryRow | null
  onClose: () => void
}) {
  const t = useTranslations("adminPanel.blogCategoriesPage")
  const tForm = useTranslations("adminPanel.blogCategoriesPage.form")
  const [pending, startTransition] = useTransition()
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? "")
  const [nameFr, setNameFr] = useState(initial?.name_fr ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [orderIndex, setOrderIndex] = useState(initial?.order_index ?? 0)
  const [slugTouched, setSlugTouched] = useState(!!initial)

  const isEdit = !!initial

  function onNameFrChange(v: string) {
    setNameFr(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      name_ar: nameAr.trim(),
      name_fr: nameFr.trim(),
      slug: slug.trim() || slugify(nameFr),
      order_index: orderIndex,
    }
    startTransition(async () => {
      const res = isEdit
        ? await updateBlogCategory({ ...payload, id: initial!.id })
        : await createBlogCategory(payload)
      if (!res.ok) {
        toast.error(
          res.error === "slug_taken" ? t("toast.slugTaken") : t("toast.error"),
        )
        return
      }
      toast.success(isEdit ? t("toast.updated") : t("toast.created"))
      onClose()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <Field label={tForm("nameAr")}>
        <input
          type="text"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          placeholder={tForm("nameArPlaceholder")}
          dir="rtl"
          required
          minLength={1}
          maxLength={80}
          className={inputCls}
        />
      </Field>

      <Field label={tForm("nameFr")}>
        <input
          type="text"
          value={nameFr}
          onChange={(e) => onNameFrChange(e.target.value)}
          placeholder={tForm("nameFrPlaceholder")}
          required
          minLength={1}
          maxLength={80}
          className={inputCls}
        />
      </Field>

      <Field label={tForm("slug")} hint={tForm("slugHelp")}>
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
          className={`${inputCls} font-mono`}
        />
      </Field>

      <Field label={tForm("orderIndex")} hint={tForm("orderIndexHelp")}>
        <input
          type="number"
          value={orderIndex}
          onChange={(e) => setOrderIndex(Number(e.target.value) || 0)}
          min={0}
          max={9999}
          className={inputCls}
        />
      </Field>

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
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

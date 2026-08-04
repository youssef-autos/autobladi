"use client"

import { useState, useTransition } from "react"
import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createPage, updatePage } from "@/app/[locale]/admin/pages/actions"
import { RichTextEditor } from "@/components/admin/RichTextEditor"
import { Field } from "@/components/ui/Field"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { Link, useRouter } from "@/i18n/navigation"
import { slugify } from "@/lib/validations/page"
import type { Tables } from "@/types/database.types"

type Props = {
  mode: "create" | "edit"
  initial?: Tables<"pages"> | null
}

export function PageEditor({ mode, initial }: Props) {
  const t = useTranslations("adminPanel.pagesPage")
  const tForm = useTranslations("adminPanel.pagesPage.form")
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(mode === "edit")
  const [titleFr, setTitleFr] = useState(initial?.title_fr ?? "")
  const [titleAr, setTitleAr] = useState(initial?.title_ar ?? "")
  const [contentFr, setContentFr] = useState(initial?.content_fr ?? "")
  const [contentAr, setContentAr] = useState(initial?.content_ar ?? "")
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? true)
  const [showInFooter, setShowInFooter] = useState(initial?.show_in_footer ?? true)
  const [orderIndex, setOrderIndex] = useState(initial?.order_index ?? 0)

  const isEdit = mode === "edit"

  function onTitleFrChange(v: string) {
    setTitleFr(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      slug: slug.trim() || slugify(titleFr),
      title_fr: titleFr.trim(),
      title_ar: titleAr.trim(),
      content_fr: contentFr.trim() ? contentFr : null,
      content_ar: contentAr.trim() ? contentAr : null,
      is_published: isPublished,
      show_in_footer: showInFooter,
      order_index: orderIndex,
    }
    startTransition(async () => {
      const res = isEdit
        ? await updatePage({ ...payload, id: initial!.id })
        : await createPage(payload)
      if (!res.ok) {
        toast.error(
          res.error === "slug_taken" ? t("toast.slugTaken") : t("toast.error"),
        )
        return
      }
      toast.success(isEdit ? t("toast.updated") : t("toast.created"))
      router.push("/admin/pages")
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/admin/pages"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {tForm("back")}
        </Link>
        <MoroccanButton type="submit" size="sm" loading={pending}>
          {pending ? tForm("saving") : tForm("save")}
        </MoroccanButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-5 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={tForm("titleFr")}>
              <input
                type="text"
                value={titleFr}
                onChange={(e) => onTitleFrChange(e.target.value)}
                placeholder={tForm("titleFrPlaceholder")}
                required
                maxLength={160}
                className={inputCls}
              />
            </Field>
            <Field label={tForm("titleAr")}>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder={tForm("titleArPlaceholder")}
                dir="rtl"
                required
                maxLength={160}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label={tForm("slug")} help={tForm("slugHelp")}>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              placeholder="a-propos"
              pattern="^[a-z0-9-]+$"
              required
              className={`${inputCls} font-mono`}
            />
          </Field>

          <Field label={tForm("contentFr")}>
            <RichTextEditor
              value={contentFr}
              onChange={setContentFr}
              dir="ltr"
              placeholder={tForm("contentPlaceholder")}
            />
          </Field>

          <Field label={tForm("contentAr")}>
            <RichTextEditor
              value={contentAr}
              onChange={setContentAr}
              dir="rtl"
              placeholder={tForm("contentPlaceholder")}
            />
          </Field>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <Toggle
              label={tForm("published")}
              checked={isPublished}
              onChange={setIsPublished}
            />
            <Toggle
              label={tForm("showInFooter")}
              checked={showInFooter}
              onChange={setShowInFooter}
            />
            <Field label={tForm("orderIndex")} help={tForm("orderIndexHelp")}>
              <input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value) || 0)}
                min={0}
                max={9999}
                className={inputCls}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground px-1">{tForm("editorHelp")}</p>
        </aside>
      </div>
    </form>
  )
}

const inputCls =
  "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-moroccan-mint-500"
      />
    </label>
  )
}


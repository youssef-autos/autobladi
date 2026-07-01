"use client"

import { useRef, useState, useTransition } from "react"
import { ArrowLeft, Eye, Loader2, Pencil, Upload, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  createBlogPost,
  updateBlogPost,
} from "@/app/[locale]/admin/blog/actions"
import { uploadBlogImage } from "@/app/[locale]/admin/blog/upload-action"
import { MarkdownPreview } from "@/components/admin/blog/posts/MarkdownPreview"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { Link, useRouter } from "@/i18n/navigation"
import { slugify } from "@/lib/validations/blog-post"
import type { AdminBlogPostFull } from "@/lib/queries/admin"

type CategoryOption = { id: string; name_ar: string; name_fr: string }

type Props = {
  mode: "create" | "edit"
  categories: CategoryOption[]
  initial?: AdminBlogPostFull | null
}

export function BlogPostEditor({ mode, categories, initial }: Props) {
  const t = useTranslations("adminPanel.blogPostsPage")
  const tForm = useTranslations("adminPanel.blogPostsPage.form")
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Primary content = Arabic; *_fr = the optional French translation.
  const [lang, setLang] = useState<"ar" | "fr">("ar")
  const [title, setTitle] = useState(initial?.title ?? "")
  const [titleFr, setTitleFr] = useState(initial?.title_fr ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(mode === "edit")
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "")
  const [excerptFr, setExcerptFr] = useState(initial?.excerpt_fr ?? "")
  const [content, setContent] = useState(initial?.content ?? "")
  const [contentFr, setContentFr] = useState(initial?.content_fr ?? "")
  const [coverImage, setCoverImage] = useState(initial?.cover_image ?? "")
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "")
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "))
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false)

  const [tab, setTab] = useState<"write" | "preview">("write")
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingInline, setUploadingInline] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const inlineInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const isEdit = mode === "edit"

  // The title/excerpt/content editors bind to whichever language tab is active.
  const activeTitle = lang === "ar" ? title : titleFr
  const activeExcerpt = lang === "ar" ? excerpt : excerptFr
  const activeContent = lang === "ar" ? content : contentFr
  const setActiveTitle = lang === "ar" ? setTitle : setTitleFr
  const setActiveExcerpt = lang === "ar" ? setExcerpt : setExcerptFr
  const setActiveContent = lang === "ar" ? setContent : setContentFr

  function onTitleChange(v: string) {
    setActiveTitle(v)
    // Slug always derives from the French title (Latin characters only).
    if (!slugTouched && lang === "fr") {
      const s = slugify(v)
      if (s) setSlug(s)
    }
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await uploadBlogImage(fd)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setCoverImage(res.url)
      toast.success(tForm("imageUploaded"))
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleInlineUpload(file: File) {
    setUploadingInline(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await uploadBlogImage(fd)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      // Insert markdown image at the cursor position (into the active language).
      const md = `\n\n![](${res.url})\n\n`
      const el = contentRef.current
      if (el) {
        const start = el.selectionStart ?? activeContent.length
        const next =
          activeContent.slice(0, start) + md + activeContent.slice(start)
        setActiveContent(next)
      } else {
        setActiveContent(activeContent + md)
      }
      toast.success(tForm("imageInserted"))
    } finally {
      setUploadingInline(false)
    }
  }

  function buildPayload() {
    const tags = tagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20)
    return {
      title: title.trim(),
      slug: slug.trim() || slugify(titleFr),
      excerpt: excerpt.trim() || null,
      content: content.trim() ? content : null,
      title_fr: titleFr.trim() || null,
      excerpt_fr: excerptFr.trim() || null,
      content_fr: contentFr.trim() ? contentFr : null,
      cover_image: coverImage.trim() || null,
      category_id: categoryId || null,
      tags,
      is_published: isPublished,
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = buildPayload()
    startTransition(async () => {
      const res = isEdit
        ? await updateBlogPost({ ...payload, id: initial!.id })
        : await createBlogPost(payload)
      if (!res.ok) {
        toast.error(
          res.error === "slug_taken" ? t("toast.slugTaken") : t("toast.error"),
        )
        return
      }
      toast.success(isEdit ? t("toast.updated") : t("toast.created"))
      router.push("/admin/blog")
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {tForm("back")}
        </Link>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-card text-sm font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="size-4 accent-moroccan-mint-500"
            />
            {tForm("published")}
          </label>
          <MoroccanButton type="submit" size="sm" loading={pending}>
            {pending ? tForm("saving") : tForm("save")}
          </MoroccanButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main column */}
        <div className="space-y-5 min-w-0">
          {/* Language switch: Arabic (primary) / French (translation) */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
            <LangButton
              active={lang === "ar"}
              onClick={() => setLang("ar")}
              label={tForm("langAr")}
            />
            <LangButton
              active={lang === "fr"}
              onClick={() => setLang("fr")}
              label={tForm("langFr")}
            />
            <span className="ms-auto pe-2 text-xs text-muted-foreground">
              {lang === "ar" ? tForm("langArHint") : tForm("langFrHint")}
            </span>
          </div>

          <Field label={tForm("title")}>
            <input
              type="text"
              value={activeTitle}
              dir={lang === "ar" ? "rtl" : "ltr"}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={tForm("titlePlaceholder")}
              required={lang === "ar"}
              maxLength={200}
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
              placeholder="mon-article"
              pattern="^[a-z0-9-]+$"
              required
              className={`${inputCls} font-mono`}
            />
          </Field>

          <Field label={tForm("excerpt")} hint={tForm("excerptHelp")}>
            <textarea
              value={activeExcerpt}
              dir={lang === "ar" ? "rtl" : "ltr"}
              onChange={(e) => setActiveExcerpt(e.target.value)}
              placeholder={tForm("excerptPlaceholder")}
              rows={2}
              maxLength={500}
              className={`${inputCls} h-auto py-2.5 resize-y`}
            />
          </Field>

          {/* Content: write / preview tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {tForm("content")}
              </span>
              <div className="flex items-center gap-1">
                <TabButton
                  active={tab === "write"}
                  onClick={() => setTab("write")}
                  icon={Pencil}
                  label={tForm("write")}
                />
                <TabButton
                  active={tab === "preview"}
                  onClick={() => setTab("preview")}
                  icon={Eye}
                  label={tForm("preview")}
                />
              </div>
            </div>

            {tab === "write" ? (
              <>
                <textarea
                  ref={contentRef}
                  value={activeContent}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  onChange={(e) => setActiveContent(e.target.value)}
                  placeholder={tForm("contentPlaceholder")}
                  rows={20}
                  className={`${inputCls} h-auto py-3 font-mono text-[13px] leading-relaxed resize-y`}
                />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground">
                    {tForm("markdownHelp")}
                  </p>
                  <button
                    type="button"
                    disabled={uploadingInline}
                    onClick={() => inlineInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-dashed border-moroccan-gold-500/60 bg-moroccan-gold-50/40 text-xs font-medium text-moroccan-gold-700 hover:bg-moroccan-gold-50 disabled:opacity-60"
                  >
                    {uploadingInline ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    {tForm("insertImage")}
                  </button>
                  <input
                    ref={inlineInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleInlineUpload(file)
                      e.target.value = ""
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 min-h-[300px]" dir={lang === "ar" ? "rtl" : "ltr"}>
                <MarkdownPreview content={activeContent} />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar column */}
        <aside className="space-y-5">
          {/* Cover image */}
          <fieldset className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <legend className="px-1 text-sm font-semibold text-foreground">
              {tForm("cover")}
            </legend>

            <p className="text-xs text-muted-foreground -mt-1">
              {tForm("coverHint")}
            </p>

            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-moroccan-sand-50 border border-border flex items-center justify-center">
              {coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  {tForm("noCover")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
                className="inline-flex flex-1 items-center justify-center gap-2 h-9 px-3 rounded-xl border border-dashed border-moroccan-gold-500/60 bg-moroccan-gold-50/40 text-xs font-medium text-moroccan-gold-700 hover:bg-moroccan-gold-50 disabled:opacity-60"
              >
                {uploadingCover ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                {uploadingCover ? tForm("uploading") : tForm("uploadCover")}
              </button>
              {coverImage && (
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="size-9 inline-flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-moroccan-red-50 hover:text-moroccan-red-600"
                  aria-label={tForm("removeCover")}
                >
                  <X className="size-4" />
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleCoverUpload(file)
                  e.target.value = ""
                }}
              />
            </div>
          </fieldset>

          {/* Category */}
          <Field label={tForm("category")}>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputCls}
            >
              <option value="">{tForm("noCategory")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_fr} — {c.name_ar}
                </option>
              ))}
            </select>
          </Field>

          {/* Tags */}
          <Field label={tForm("tags")} hint={tForm("tagsHelp")}>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder={tForm("tagsPlaceholder")}
              className={inputCls}
            />
          </Field>
        </aside>
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

function LangButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center h-9 px-4 rounded-lg text-sm font-semibold transition-colors " +
        (active
          ? "bg-moroccan-gradient text-white shadow-sm"
          : "text-muted-foreground hover:bg-moroccan-sand-50")
      }
    >
      {label}
    </button>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-colors " +
        (active
          ? "bg-moroccan-red-50 text-moroccan-red-600"
          : "text-muted-foreground hover:bg-moroccan-sand-50")
      }
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}


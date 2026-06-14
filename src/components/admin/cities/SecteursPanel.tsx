"use client"

import { useState, useTransition } from "react"
import { Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  createSecteur,
  deleteSecteur,
  fetchSecteursForCity,
  updateSecteur,
} from "@/app/[locale]/admin/cities/secteur-actions"
import { slugify } from "@/lib/validations/secteur"
import { cn } from "@/lib/utils"

type Secteur = {
  id: string
  city_id: string
  name_ar: string
  name_fr: string
  slug: string
  created_at: string
}

type Props = {
  cityId: string
  cityName: string
  /** Count hint so the button can say "3 قطاعات" before expanding. */
  countHint?: number
}

/**
 * Inline accordion panel that loads secteurs on demand and lets admins
 * add / edit / delete them without leaving the cities page.
 * Keeping it fully client-side avoids a round-trip reload of the whole
 * cities table whenever a secteur changes.
 */
export function SecteursPanel({ cityId, cityName, countHint }: Props) {
  const t = useTranslations("adminPanel.citiesPage")
  const tS = useTranslations("adminPanel.citiesPage.secteurs")

  const [open, setOpen] = useState(false)
  const [secteurs, setSecteurs] = useState<Secteur[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addingNew, setAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function toggle() {
    if (!open && !loaded) {
      setLoading(true)
      try {
        const data = await fetchSecteursForCity(cityId)
        setSecteurs(data)
        setLoaded(true)
      } finally {
        setLoading(false)
      }
    }
    setOpen((o) => !o)
  }

  function reload() {
    startTransition(async () => {
      const data = await fetchSecteursForCity(cityId)
      setSecteurs(data)
    })
  }

  function onSaved() {
    setAddingNew(false)
    setEditingId(null)
    reload()
  }

  function onDelete(id: string, name: string) {
    if (!window.confirm(tS("deleteConfirm", { name }))) return
    setPendingId(id)
    startTransition(async () => {
      const res = await deleteSecteur(id)
      setPendingId(null)
      if (!res.ok) {
        toast.error(tS("toast.error"))
        return
      }
      toast.success(tS("toast.deleted"))
      reload()
    })
  }

  // Count to show on the button
  const count = loaded ? secteurs.length : countHint

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 h-7 text-xs font-medium transition-colors",
          open
            ? "bg-moroccan-gold-50 border-moroccan-gold-500/40 text-moroccan-gold-700"
            : "border-border text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground",
        )}
      >
        {loading ? (
          <span className="animate-pulse">...</span>
        ) : (
          <>
            {t("secteursCount", { count: count ?? 0 })}
            {open ? (
              <ChevronUp className="size-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-3" aria-hidden="true" />
            )}
          </>
        )}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-moroccan-gold-500/25 bg-moroccan-gold-50/30 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">
              {tS("title", { city: cityName })}
            </p>
            <button
              type="button"
              onClick={() => {
                setAddingNew(true)
                setEditingId(null)
              }}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-moroccan-red-500 text-white text-xs font-semibold hover:bg-moroccan-red-600"
            >
              <Plus className="size-3" aria-hidden="true" />
              {tS("addSecteur")}
            </button>
          </div>

          {/* New secteur form */}
          {addingNew && (
            <SecteurForm
              cityId={cityId}
              initial={null}
              onSave={onSaved}
              onCancel={() => setAddingNew(false)}
            />
          )}

          {/* Secteurs list */}
          {secteurs.length === 0 && !addingNew ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              {tS("empty")}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {secteurs.map((s) => (
                <li key={s.id}>
                  {editingId === s.id ? (
                    <SecteurForm
                      cityId={cityId}
                      initial={s}
                      onSave={onSaved}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2">
                      <span className="text-sm text-foreground" dir="rtl">
                        {s.name_ar}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-sm text-foreground flex-1">
                        {s.name_fr}
                      </span>
                      <code className="text-[10px] text-muted-foreground font-mono bg-moroccan-sand-50 rounded px-1">
                        {s.slug}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(s.id)
                          setAddingNew(false)
                        }}
                        className="size-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700"
                        aria-label="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(s.id, s.name_fr)}
                        disabled={pendingId === s.id}
                        className="size-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-moroccan-red-50 hover:text-moroccan-red-600 disabled:opacity-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline form — used for both add and edit
// ---------------------------------------------------------------------------
function SecteurForm({
  cityId,
  initial,
  onSave,
  onCancel,
}: {
  cityId: string
  initial: Secteur | null
  onSave: () => void
  onCancel: () => void
}) {
  const tS = useTranslations("adminPanel.citiesPage.secteurs.form")
  const tToast = useTranslations("adminPanel.citiesPage.secteurs.toast")
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? "")
  const [nameFr, setNameFr] = useState(initial?.name_fr ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [pending, startTransition] = useTransition()

  const isEdit = !!initial

  function onNameFrChange(v: string) {
    setNameFr(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      city_id: cityId,
      name_ar: nameAr.trim(),
      name_fr: nameFr.trim(),
      slug: slug.trim() || slugify(nameFr),
    }
    startTransition(async () => {
      const res = isEdit
        ? await updateSecteur({ ...payload, id: initial!.id })
        : await createSecteur(payload)
      if (!res.ok) {
        const msg =
          res.error === "slug_taken"
            ? tToast("slugTaken")
            : tToast("error")
        toast.error(msg)
        return
      }
      toast.success(isEdit ? tToast("updated") : tToast("created"))
      onSave()
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-2 rounded-lg bg-background border border-moroccan-gold-500/30 px-3 py-2.5"
    >
      <label className="flex flex-col gap-1 min-w-[120px] flex-1">
        <span className="text-[10px] text-muted-foreground">{tS("nameAr")}</span>
        <input
          type="text"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          placeholder={tS("nameArPlaceholder")}
          dir="rtl"
          required
          maxLength={80}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1 min-w-[120px] flex-1">
        <span className="text-[10px] text-muted-foreground">{tS("nameFr")}</span>
        <input
          type="text"
          value={nameFr}
          onChange={(e) => onNameFrChange(e.target.value)}
          placeholder={tS("nameFrPlaceholder")}
          required
          maxLength={80}
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1 min-w-[90px]">
        <span className="text-[10px] text-muted-foreground">{tS("slug")}</span>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          placeholder={tS("slugPlaceholder")}
          pattern="^[a-z0-9-]+$"
          required
          maxLength={80}
          className={inputCls}
        />
      </label>
      <div className="flex items-center gap-1 pb-0.5">
        <button
          type="submit"
          disabled={pending}
          className="size-8 inline-flex items-center justify-center rounded-lg bg-moroccan-red-500 text-white hover:bg-moroccan-red-600 disabled:opacity-50"
          aria-label="Save"
        >
          <Check className="size-4" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="size-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-moroccan-sand-50"
          aria-label="Cancel"
        >
          <X className="size-4" />
        </button>
      </div>
    </form>
  )
}

const inputCls =
  "h-8 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-moroccan-gold-500/60"

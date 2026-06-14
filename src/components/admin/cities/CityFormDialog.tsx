"use client"

import { useState, useTransition } from "react"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  createCity,
  updateCity,
} from "@/app/[locale]/admin/cities/actions"
import {
  createSecteur,
  deleteSecteur,
  fetchSecteursForCity,
  updateSecteur,
} from "@/app/[locale]/admin/cities/secteur-actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { slugify } from "@/lib/validations/city"
import type { AdminCityRow } from "@/lib/queries/admin"

type Secteur = {
  id: string
  city_id: string
  name_ar: string
  name_fr: string
  slug: string
  created_at: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: AdminCityRow | null
}

export function CityFormDialog({ open, onOpenChange, initial }: Props) {
  const t = useTranslations("adminPanel.citiesPage")
  const tForm = useTranslations("adminPanel.citiesPage.form")
  const isEdit = !!initial
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? tForm("edit") : t("addManual")}
          </DialogTitle>
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

// ---------------------------------------------------------------------------
// Inner form — Phase 1: city info | Phase 2: secteurs (after save)
// ---------------------------------------------------------------------------
function InnerForm({
  initial,
  onClose,
}: {
  initial: AdminCityRow | null
  onClose: () => void
}) {
  const t = useTranslations("adminPanel.citiesPage")
  const tForm = useTranslations("adminPanel.citiesPage.form")
  const tS = useTranslations("adminPanel.citiesPage.secteurs")

  const isEdit = !!initial

  const [pending, startTransition] = useTransition()
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? "")
  const [nameFr, setNameFr] = useState(initial?.name_fr ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [region, setRegion] = useState(initial?.region ?? "")
  const [slugTouched, setSlugTouched] = useState(!!initial)

  // Secteurs state — unlocked after city save (or immediately in edit mode)
  const [cityId, setCityId] = useState<string | null>(
    isEdit ? initial!.id : null,
  )
  const [secteurs, setSecteurs] = useState<Secteur[]>([])
  const [secteursReady, setSecteursReady] = useState(false)

  // Load secteurs for an existing city immediately on mount (edit mode)
  useState(() => {
    if (isEdit) {
      fetchSecteursForCity(initial!.id).then((data) => {
        setSecteurs(data)
        setSecteursReady(true)
      })
    }
  })

  function reloadSecteurs(id: string) {
    fetchSecteursForCity(id).then(setSecteurs)
  }

  function onNameFrChange(v: string) {
    setNameFr(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function onSubmitCity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      name_ar: nameAr.trim(),
      name_fr: nameFr.trim(),
      slug: slug.trim() || slugify(nameFr),
      region: region.trim() || null,
    }
    startTransition(async () => {
      const res = isEdit
        ? await updateCity({ ...payload, id: initial!.id })
        : await createCity(payload)
      if (!res.ok) {
        toast.error(
          res.error === "slug_taken" ? "Slug already used" : t("toast.error"),
        )
        return
      }
      toast.success(isEdit ? t("toast.updated") : t("toast.created"))

      if (!isEdit) {
        // Look up the new city's UUID so we can attach secteurs
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { data: row } = await supabase
          .from("cities")
          .select("id")
          .eq("slug", payload.slug)
          .maybeSingle<{ id: string }>()
        if (row?.id) {
          setCityId(row.id)
          setSecteursReady(true)
        }
      } else {
        reloadSecteurs(initial!.id)
      }
    })
  }

  return (
    <div className="mt-2 space-y-5">
      {/* ── Phase 1: City info ─────────────────────────────── */}
      <form onSubmit={onSubmitCity} className="space-y-4">
        <Field label={tForm("nameAr")}>
          <input
            type="text"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder={tForm("nameArPlaceholder")}
            dir="rtl"
            required
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
            className={inputCls}
          />
        </Field>

        <Field label={tForm("region")}>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder={tForm("regionPlaceholder")}
            maxLength={120}
            className={inputCls}
          />
        </Field>

        <div className="flex justify-between items-center gap-2">
          {/* Hint before first save in create mode */}
          {!isEdit && !cityId && (
            <p className="text-xs text-muted-foreground">
              💡 {tS("emptyDesc")}
            </p>
          )}
          <div className="flex gap-2 ms-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
            >
              {isEdit || cityId ? "Fermer" : tForm("cancel")}
            </button>
            <MoroccanButton type="submit" size="sm" loading={pending}>
              {pending ? tForm("saving") : tForm("save")}
            </MoroccanButton>
          </div>
        </div>
      </form>

      {/* ── Phase 2: Secteurs — shown after city saved ─────────── */}
      {secteursReady && cityId && (
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {tS("title", { city: nameFr || initial?.name_fr || "" })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tS("emptyDesc")}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {t("secteursCount", { count: secteurs.length })}
            </span>
          </div>

          <SecteursManager
            cityId={cityId}
            secteurs={secteurs}
            onChanged={() => reloadSecteurs(cityId)}
          />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Secteurs manager — inline list + add/edit forms
// ---------------------------------------------------------------------------
function SecteursManager({
  cityId,
  secteurs,
  onChanged,
}: {
  cityId: string
  secteurs: Secteur[]
  onChanged: () => void
}) {
  const tS = useTranslations("adminPanel.citiesPage.secteurs")
  const [addingNew, setAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function onDelete(id: string, name: string) {
    if (!window.confirm(tS("deleteConfirm", { name }))) return
    setPendingId(id)
    startTransition(async () => {
      const res = await deleteSecteur(id)
      setPendingId(null)
      if (!res.ok) {
        toast.error(`${tS("toast.error")}: ${res.error}`, { duration: 6000 })
        return
      }
      onChanged()
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          setAddingNew(true)
          setEditingId(null)
        }}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-dashed border-moroccan-red-500/50 text-moroccan-red-500 text-xs font-medium hover:bg-moroccan-red-50 transition-colors"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        {tS("addSecteur")}
      </button>

      {addingNew && (
        <SecteurFormInline
          cityId={cityId}
          initial={null}
          onSave={() => {
            setAddingNew(false)
            onChanged()
          }}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {secteurs.length === 0 && !addingNew ? (
        <p className="text-xs text-muted-foreground py-1">{tS("empty")}</p>
      ) : (
        <ul className="space-y-1.5">
          {secteurs.map((s) => (
            <li key={s.id}>
              {editingId === s.id ? (
                <SecteurFormInline
                  cityId={cityId}
                  initial={s}
                  onSave={() => {
                    setEditingId(null)
                    onChanged()
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <span dir="rtl" className="text-foreground">
                    {s.name_ar}
                  </span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-foreground flex-1">{s.name_fr}</span>
                  <code className="text-[10px] font-mono text-muted-foreground bg-moroccan-sand-50 rounded px-1.5 py-0.5 border border-border">
                    {s.slug}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(s.id)
                      setAddingNew(false)
                    }}
                    className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-moroccan-gold-700"
                    aria-label="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(s.id, s.name_fr)}
                    disabled={pendingId === s.id}
                    className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-moroccan-red-50 hover:text-moroccan-red-600 disabled:opacity-50"
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
  )
}

// ---------------------------------------------------------------------------
// Inline form for a single secteur
// ---------------------------------------------------------------------------
function SecteurFormInline({
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
        // Show the raw DB error so the admin can diagnose issues like a
        // missing table (migration not run) or permission problems.
        const msg =
          res.error === "slug_taken"
            ? tToast("slugTaken")
            : res.error.includes("relation") || res.error.includes("does not exist")
              ? "❌ Table secteurs manquante — exécutez la migration 011 dans Supabase SQL Editor"
              : res.error.includes("permission")
                ? "❌ Permission refusée — vérifiez les grants Supabase"
                : `${tToast("error")}: ${res.error}`
        toast.error(msg, { duration: 8000 })
        return
      }
      toast.success(isEdit ? tToast("updated") : tToast("created"))
      onSave()
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-moroccan-gold-500/30 bg-moroccan-gold-50/30 p-3 space-y-2"
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">{tS("nameAr")}</span>
          <input
            type="text"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder={tS("nameArPlaceholder")}
            dir="rtl"
            required
            maxLength={80}
            className={inputSmCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">{tS("nameFr")}</span>
          <input
            type="text"
            value={nameFr}
            onChange={(e) => onNameFrChange(e.target.value)}
            placeholder={tS("nameFrPlaceholder")}
            required
            maxLength={80}
            className={inputSmCls}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-muted-foreground">
          {tS("slug")} — <span className="italic">{tS("slugHelp")}</span>
        </span>
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
          className={inputSmCls}
        />
      </label>
      <div className="flex justify-end gap-1.5 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:bg-moroccan-sand-50 flex items-center gap-1"
        >
          <X className="size-3.5" />
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-moroccan-red-500 text-white text-xs font-semibold hover:bg-moroccan-red-600 disabled:opacity-50"
        >
          <Check className="size-3.5" />
          {pending ? tS("saving") : tS("save")}
        </button>
      </div>
    </form>
  )
}

const inputCls =
  "w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"

const inputSmCls =
  "w-full h-9 px-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-moroccan-gold-500/50"

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

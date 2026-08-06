"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  Check,
  ImageIcon,
  MapPin,
  Send,
  Star,
  Store,
  Upload,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { submitShowroom } from "@/app/[locale]/dashboard/showroom/actions"
import { MapPicker } from "@/components/dashboard/showroom/MapPicker"
import { OpeningHoursEditor } from "@/components/dashboard/showroom/OpeningHoursEditor"
import { Combobox } from "@/components/ui/combobox"
import { Field } from "@/components/ui/Field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  DEFAULT_HOURS,
  type ShowroomInfoInput,
  type OpeningHoursMap,
} from "@/lib/validations/showroom"
import type { City, Secteur } from "@/lib/queries/home"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  userId: string
  cities: City[]
  secteurs: Secteur[]
}

// Storage bucket keeps its original id "concessionnaires" so existing image
// URLs stay valid. Images are uploaded under the user id, so they can be
// stored before the showroom row exists.
const SHOWROOM_BUCKET = "concessionnaires"

const STEP_KEYS = ["design", "info", "contact", "preview"] as const

/** Build a URL-safe slug from a (latin) name; empty for non-latin scripts. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

async function uploadImage(
  file: File,
  kind: "logo" | "cover",
  userId: string,
): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const path = `${userId}/${kind}-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from(SHOWROOM_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return supabase.storage.from(SHOWROOM_BUCKET).getPublicUrl(path).data.publicUrl
}

export function CreateShowroomWizard({ userId, cities, secteurs }: Props) {
  const tc = useTranslations("showroom.create")
  const t = useTranslations("showroom.info")
  const tHours = useTranslations("showroom.hours")
  const locale = useLocale() as Locale
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [step, setStep] = useState(0)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  // Fallback slug for Arabic-only names (slugify would yield empty).
  const fallbackSlug = `showroom-${userId.replace(/-/g, "").slice(0, 8)}`

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [cityId, setCityId] = useState<string | null>(null)
  const [secteurId, setSecteurId] = useState<string | null>(null)
  const availableSecteurs = secteurs.filter((s) => s.city_id === cityId)
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [facebook, setFacebook] = useState("")
  const [instagram, setInstagram] = useState("")
  const [youtube, setYoutube] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [hours, setHours] = useState<OpeningHoursMap>(DEFAULT_HOURS)

  const effectiveSlug = (slugEdited ? slug : slugify(name) || fallbackSlug)
    .toLowerCase()
    .replace(/\s+/g, "-")

  const cityName = cityId
    ? (() => {
        const c = cities.find((x) => x.id === cityId)
        return c ? (locale === "ar" ? c.name_ar : c.name_fr) : null
      })()
    : null

  function onNameChange(v: string) {
    setName(v)
    if (!slugEdited) setSlug(slugify(v) || fallbackSlug)
  }

  async function handleUpload(
    file: File,
    kind: "logo" | "cover",
    setter: (v: string) => void,
    busySetter: (v: boolean) => void,
  ) {
    busySetter(true)
    try {
      setter(await uploadImage(file, kind, userId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorTitle"))
    } finally {
      busySetter(false)
    }
  }

  function goNext() {
    // The only hard gate is a valid name/slug before leaving the info step.
    if (step === 1) {
      if (name.trim().length < 2) {
        toast.error(tc("nameRequired"))
        return
      }
      if (!/^[a-z0-9-]{3,80}$/.test(effectiveSlug)) {
        toast.error(tc("slugRequired"))
        return
      }
    }
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1))
  }

  function submit() {
    if (name.trim().length < 2) {
      setStep(1)
      toast.error(tc("nameRequired"))
      return
    }
    if (!/^[a-z0-9-]{3,80}$/.test(effectiveSlug)) {
      setStep(1)
      toast.error(tc("slugRequired"))
      return
    }
    const payload: ShowroomInfoInput = {
      name: name.trim(),
      slug: effectiveSlug,
      description: description.trim() || null,
      address: address.trim() || null,
      city_id: cityId,
      secteur_id: secteurId,
      latitude: lat,
      longitude: lng,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      email: email.trim() || null,
      website: website.trim() || null,
      facebook: facebook.trim() || null,
      instagram: instagram.trim() || null,
      youtube: youtube.trim() || null,
      tiktok: tiktok.trim() || null,
      linkedin: linkedin.trim() || null,
      logo_url: logoUrl,
      cover_url: coverUrl,
      opening_hours: hours,
    }
    startTransition(async () => {
      const res = await submitShowroom(payload)
      if (!res.ok) {
        if (res.error === "slug_taken") {
          setStep(1)
          setSlugEdited(true)
          toast.error(tc("slugTaken"))
        } else {
          toast.error(tc("error"))
        }
        return
      }
      toast.success(tc("successTitle"), { description: tc("successDesc") })
      router.refresh()
    })
  }

  const advantages = [
    { icon: Store, key: "storefront" as const },
    { icon: BadgeCheck, key: "badge" as const },
    { icon: Car, key: "allCars" as const },
    { icon: Star, key: "reviews" as const },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <header className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-moroccan-red-50 text-moroccan-red-500">
            <Store className="size-5" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {tc("title")}
          </h1>
        </div>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {tc("subtitle")}
        </p>
      </header>

      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEP_KEYS.map((key, i) => {
          const done = i < step
          const active = i === step
          return (
            <li key={key} className="flex-1">
              <button
                type="button"
                onClick={() => setStep(i)}
                className="w-full text-start"
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-colors",
                    done || active ? "bg-moroccan-red-500" : "bg-border",
                  )}
                />
                <span className="mt-2 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                      done
                        ? "bg-moroccan-red-500 text-white"
                        : active
                          ? "bg-moroccan-red-500/15 text-moroccan-red-600"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-2.5" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] uppercase tracking-wide truncate",
                      active
                        ? "font-semibold text-moroccan-red-600"
                        : "text-muted-foreground",
                    )}
                  >
                    {tc(`steps.${key}`)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {/* Advantages — shown on the first step, like a value reminder */}
      {step === 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-brand-dark p-6 text-white">
          <div
            className="pointer-events-none absolute -top-16 end-0 size-64 rounded-full bg-moroccan-gold-500/10 blur-3xl"
            aria-hidden="true"
          />
          <h2 className="relative font-display text-lg font-bold">
            {tc("advantages.title")}
          </h2>
          <div className="relative mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {advantages.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-moroccan-red-500/20 text-moroccan-red-300">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium leading-snug text-white/90">
                  {tc(`advantages.${key}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        {step === 0 && (
          <DesignStep
            t={t}
            title={tc("designTitle")}
            hint={tc("designHint")}
            logoUrl={logoUrl}
            coverUrl={coverUrl}
            uploadingLogo={uploadingLogo}
            uploadingCover={uploadingCover}
            onLogo={(f) => handleUpload(f, "logo", setLogoUrl, setUploadingLogo)}
            onCover={(f) => handleUpload(f, "cover", setCoverUrl, setUploadingCover)}
          />
        )}

        {step === 1 && (
          <div className="space-y-5">
            <StepHeading title={tc("steps.info")} hint={tc("infoHint")} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={t("name")} required>
                <Input
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  className="h-11 rounded-xl"
                />
              </Field>
              <Field
                label={t("slug")}
                help={t("slugHelp", { slug: effectiveSlug || "—" })}
              >
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    setSlugEdited(true)
                  }}
                  pattern="[a-z0-9-]+"
                  minLength={3}
                  maxLength={80}
                  className="h-11 rounded-xl font-mono"
                  dir="ltr"
                />
              </Field>
            </div>

            <Field label={t("description")}>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={5}
                maxLength={2000}
                className="rounded-xl"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={t("address")}>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={500}
                  className="h-11 rounded-xl"
                />
              </Field>
              <Field label={t("city")}>
                <Combobox
                  items={cities.map((c) => ({
                    value: c.id,
                    label: locale === "ar" ? c.name_ar : c.name_fr,
                  }))}
                  value={cityId ?? ""}
                  onValueChange={(v) => {
                    setCityId(v || null)
                    setSecteurId(null)
                  }}
                />
              </Field>
              {availableSecteurs.length > 0 && (
                <Field label={t("secteur")}>
                  <Combobox
                    items={availableSecteurs.map((s) => ({
                      value: s.id,
                      label: locale === "ar" ? s.name_ar : s.name_fr,
                    }))}
                    value={secteurId ?? ""}
                    onValueChange={(v) => setSecteurId(v || null)}
                    placeholder={t("secteurPlaceholder")}
                    emptyText={t("secteurPlaceholder")}
                  />
                </Field>
              )}
            </div>

            <div className="space-y-2 border-t border-border/60 pt-4">
              <Label className="text-sm font-medium">{t("location")}</Label>
              <MapPicker
                latitude={lat}
                longitude={lng}
                onChange={(la, ln) => {
                  setLat(la)
                  setLng(ln)
                }}
              />
            </div>

            <div className="space-y-2 border-t border-border/60 pt-4">
              <div>
                <h4 className="font-semibold text-foreground">{tHours("title")}</h4>
                <p className="text-xs text-muted-foreground">{tHours("subtitle")}</p>
              </div>
              <OpeningHoursEditor value={hours} onChange={setHours} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <StepHeading title={tc("steps.contact")} hint={tc("contactHint")} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={t("phone")}>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212 5 22 00 00 00"
                  className="h-11 rounded-xl"
                  dir="ltr"
                />
              </Field>
              <Field label={t("whatsapp")}>
                <Input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+212 6 00 00 00 00"
                  className="h-11 rounded-xl"
                  dir="ltr"
                />
              </Field>
              <Field label={t("email")}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                  dir="ltr"
                />
              </Field>
              <Field label={t("website")}>
                <Input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                  className="h-11 rounded-xl"
                  dir="ltr"
                />
              </Field>
              <Field label={t("facebook")}>
                <Input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="h-11 rounded-xl"
                  dir="ltr"
                />
              </Field>
              <Field label={t("instagram")}>
                <Input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="h-11 rounded-xl"
                  dir="ltr"
                />
              </Field>
              <Field label={t("youtube")}>
                <Input
                  type="url"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="h-11 rounded-xl"
                  dir="ltr"
                />
              </Field>
              <Field label={t("tiktok")}>
                <Input
                  type="url"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@..."
                  className="h-11 rounded-xl"
                  dir="ltr"
                />
              </Field>
              <Field label={t("linkedin")}>
                <Input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="h-11 rounded-xl"
                  dir="ltr"
                />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <StepHeading title={tc("previewTitle")} hint={tc("previewHint")} />
            <PreviewCard
              name={name.trim() || tc("noName")}
              description={description.trim() || tc("noDescription")}
              cityName={cityName}
              logoUrl={logoUrl}
              coverUrl={coverUrl}
              slug={effectiveSlug}
              contacts={{ phone, whatsapp, email, website }}
            />
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={pending}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-moroccan-sand-50 disabled:opacity-60"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            {tc("back")}
          </button>
        ) : (
          <span />
        )}

        {step < STEP_KEYS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
          >
            {tc("next")}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 disabled:opacity-60"
          >
            <Send className="size-4" aria-hidden="true" />
            {pending ? tc("submitting") : tc("submit")}
          </button>
        )}
      </div>
    </div>
  )
}

function StepHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
    </div>
  )
}

function DesignStep({
  t,
  title,
  hint,
  logoUrl,
  coverUrl,
  uploadingLogo,
  uploadingCover,
  onLogo,
  onCover,
}: {
  t: ReturnType<typeof useTranslations>
  title: string
  hint: string
  logoUrl: string | null
  coverUrl: string | null
  uploadingLogo: boolean
  uploadingCover: boolean
  onLogo: (f: File) => void
  onCover: (f: File) => void
}) {
  return (
    <div className="space-y-6">
      <StepHeading title={title} hint={hint} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[160px_1fr] md:items-start">
        {/* Logo */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("logo")}
          </Label>
          <div className="relative size-32 rounded-2xl border border-border bg-moroccan-sand-50 overflow-hidden flex items-center justify-center">
            {logoUrl ? (
              <Image src={logoUrl} alt="" fill sizes="128px" className="object-contain p-2" />
            ) : (
              <Building2 className="size-10 text-moroccan-sand-200" strokeWidth={1.5} aria-hidden="true" />
            )}
          </div>
          <UploadButton
            label={uploadingLogo ? t("uploading") : t("uploadLogo")}
            disabled={uploadingLogo}
            onFile={onLogo}
          />
          <p className="text-[11px] leading-snug text-muted-foreground">{t("logoHint")}</p>
        </div>

        {/* Cover */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("cover")}
          </Label>
          <div className="relative aspect-[3/1] rounded-2xl border border-border bg-moroccan-sand-50 overflow-hidden">
            {coverUrl ? (
              <Image src={coverUrl} alt="" fill sizes="100vw" className="object-cover" />
            ) : (
              <ImageIcon
                className="absolute inset-0 m-auto size-10 text-moroccan-sand-200"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            )}
          </div>
          <UploadButton
            label={uploadingCover ? t("uploading") : t("uploadCover")}
            disabled={uploadingCover}
            onFile={onCover}
          />
          <p className="text-[11px] leading-snug text-muted-foreground">{t("coverHint")}</p>
        </div>
      </div>
    </div>
  )
}

function UploadButton({
  label,
  disabled,
  onFile,
}: {
  label: string
  disabled: boolean
  onFile: (f: File) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-moroccan-sand-50 cursor-pointer">
      <Upload className="size-3.5" aria-hidden="true" />
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ""
        }}
        disabled={disabled}
        className="hidden"
      />
    </label>
  )
}

function PreviewCard({
  name,
  description,
  cityName,
  logoUrl,
  coverUrl,
  slug,
  contacts,
}: {
  name: string
  description: string
  cityName: string | null
  logoUrl: string | null
  coverUrl: string | null
  slug: string
  contacts: { phone: string; whatsapp: string; email: string; website: string }
}) {
  const hasContact =
    contacts.phone || contacts.whatsapp || contacts.email || contacts.website
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Cover */}
      <div className="relative aspect-[3/1] bg-moroccan-sand-100">
        {coverUrl ? (
          <Image src={coverUrl} alt="" fill sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-moroccan-sand-100 via-moroccan-gold-50 to-moroccan-sand-100" />
        )}
      </div>
      <div className="relative z-10 -mt-9 px-5">
        <div className="grid size-[68px] place-items-center overflow-hidden rounded-2xl border-4 border-card bg-card shadow-card">
          {logoUrl ? (
            <Image src={logoUrl} alt={name} width={68} height={68} className="size-full object-contain p-1" />
          ) : (
            <Building2 className="size-7 text-moroccan-sand-200" strokeWidth={1.5} aria-hidden="true" />
          )}
        </div>
      </div>
      <div className="px-5 pb-5 pt-3 space-y-2">
        <h3 className="font-display text-lg font-bold text-foreground">{name}</h3>
        <p className="text-xs text-muted-foreground font-mono" dir="ltr">
          /showroom/{slug}
        </p>
        {cityName && (
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-moroccan-gold-500" aria-hidden="true" />
            {cityName}
          </p>
        )}
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {hasContact && (
          <div className="flex flex-wrap gap-2 pt-1" dir="ltr">
            {contacts.phone && <Chip>{contacts.phone}</Chip>}
            {contacts.whatsapp && <Chip>WhatsApp</Chip>}
            {contacts.email && <Chip>{contacts.email}</Chip>}
            {contacts.website && <Chip>Web</Chip>}
          </div>
        )}
      </div>
    </article>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-moroccan-sand-50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  )
}


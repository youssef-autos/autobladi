"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Building2, ImageIcon, Save, Sparkles, Upload } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { updateMyShowroom } from "@/app/[locale]/dashboard/showroom/actions"
import { MapPicker } from "@/components/dashboard/showroom/MapPicker"
import { OpeningHoursEditor } from "@/components/dashboard/showroom/OpeningHoursEditor"
import { Card } from "@/components/ui/Card"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import {
  DEFAULT_HOURS,
  type ShowroomInfoInput,
  type OpeningHoursMap,
} from "@/lib/validations/showroom"
import type { ShowroomDetail } from "@/lib/queries/showrooms"
import type { City, Secteur } from "@/lib/queries/home"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

type Props = {
  dealer: ShowroomDetail
  cities: City[]
  secteurs: Secteur[]
}

// Storage bucket keeps its original id "concessionnaires" so existing image
// URLs stay valid (the bucket is internal and never shown to users).
const SHOWROOM_BUCKET = "concessionnaires"

async function uploadShowroomImage(
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
  const { data } = supabase.storage.from(SHOWROOM_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function ShowroomInfoForm({ dealer, cities, secteurs }: Props) {
  const t = useTranslations("showroom.info")
  const tHours = useTranslations("showroom.hours")
  const locale = useLocale() as Locale
  const [pending, startTransition] = useTransition()
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [aiPending, setAiPending] = useState(false)

  const [name, setName] = useState(dealer.name)
  const [slug, setSlug] = useState(dealer.slug)
  const [description, setDescription] = useState(dealer.description ?? "")
  const [address, setAddress] = useState(dealer.address ?? "")
  const [cityId, setCityId] = useState<string | null>(dealer.city?.id ?? null)
  const [secteurId, setSecteurId] = useState<string | null>(dealer.secteur_id ?? null)
  const availableSecteurs = secteurs.filter((s) => s.city_id === cityId)
  const [phone, setPhone] = useState(dealer.phone ?? "")
  const [whatsapp, setWhatsapp] = useState(dealer.whatsapp ?? "")
  const [email, setEmail] = useState(dealer.email ?? "")
  const [website, setWebsite] = useState(dealer.website ?? "")
  const [facebook, setFacebook] = useState(dealer.facebook ?? "")
  const [instagram, setInstagram] = useState(dealer.instagram ?? "")
  const [youtube, setYoutube] = useState(dealer.youtube ?? "")
  const [tiktok, setTiktok] = useState(dealer.tiktok ?? "")
  const [linkedin, setLinkedin] = useState(dealer.linkedin ?? "")
  const [logoUrl, setLogoUrl] = useState<string | null>(dealer.logo_url)
  const [coverUrl, setCoverUrl] = useState<string | null>(dealer.cover_url)
  const [lat, setLat] = useState<number | null>(dealer.latitude)
  const [lng, setLng] = useState<number | null>(dealer.longitude)
  const [hours, setHours] = useState<OpeningHoursMap>(
    dealer.opening_hours ?? DEFAULT_HOURS,
  )

  async function handleImageUpload(
    file: File,
    kind: "logo" | "cover",
    setter: (v: string) => void,
    busySetter: (v: boolean) => void,
  ) {
    busySetter(true)
    try {
      const url = await uploadShowroomImage(file, kind, dealer.user_id)
      setter(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorTitle"))
    } finally {
      busySetter(false)
    }
  }

  async function generateDescription() {
    if (!name) return
    setAiPending(true)
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: name,
          model: "Showroom",
          year: new Date().getFullYear(),
          fuelType: "—",
          transmission: "—",
          options: [],
          firstOwner: false,
          accidentFree: false,
          condition: "occasion",
          language: locale,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.description) {
        toast.error(t("errorTitle"))
        return
      }
      setDescription(data.description)
    } catch {
      toast.error(t("errorTitle"))
    } finally {
      setAiPending(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: ShowroomInfoInput = {
      name,
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
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
      const result = await updateMyShowroom(payload)
      if (!result.ok) {
        toast.error(t("errorTitle"), { description: result.error })
        return
      }
      toast.success(t("savedTitle"), { description: t("savedDesc") })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Images section */}
      <Card as="section" padding="none" className="p-6 space-y-6">
        <h2 className="font-semibold text-foreground">{t("title")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 items-start">
          {/* Logo */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("logo")}
            </Label>
            <div className="relative size-32 rounded-2xl bg-moroccan-sand-50 border border-border overflow-hidden flex items-center justify-center">
              {logoUrl ? (
                <Image src={logoUrl} alt="" fill sizes="128px" className="object-contain p-2" />
              ) : (
                <Building2
                  className="size-10 text-moroccan-sand-200"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              )}
            </div>
            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-moroccan-sand-50 cursor-pointer">
              <Upload className="size-3.5" aria-hidden="true" />
              {uploadingLogo ? t("uploading") : t("uploadLogo")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleImageUpload(f, "logo", setLogoUrl, setUploadingLogo)
                  e.target.value = ""
                }}
                disabled={uploadingLogo}
                className="hidden"
              />
            </label>
            <p className="text-[11px] leading-snug text-muted-foreground">
              {t("logoHint")}
            </p>
          </div>

          {/* Cover */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("cover")}
            </Label>
            <div className="relative aspect-[3/1] rounded-2xl bg-moroccan-sand-50 border border-border overflow-hidden">
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
            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-moroccan-sand-50 cursor-pointer">
              <Upload className="size-3.5" aria-hidden="true" />
              {uploadingCover ? t("uploading") : t("uploadCover")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleImageUpload(f, "cover", setCoverUrl, setUploadingCover)
                  e.target.value = ""
                }}
                disabled={uploadingCover}
                className="hidden"
              />
            </label>
            <p className="text-[11px] leading-snug text-muted-foreground">
              {t("coverHint")}
            </p>
          </div>
        </div>
      </Card>

      {/* Basic info */}
      <Card as="section" padding="none" className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("name")}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
              className="h-11 rounded-xl"
            />
          </Field>

          <Field label={t("slug")} help={t("slugHelp", { slug: slug || "—" })}>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              pattern="[a-z0-9-]+"
              required
              minLength={3}
              maxLength={80}
              className="h-11 rounded-xl"
            />
          </Field>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{t("description")}</Label>
            <button
              type="button"
              onClick={generateDescription}
              disabled={aiPending || !name}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 text-xs font-medium",
                "bg-moroccan-gold-50 text-moroccan-gold-700 border border-moroccan-gold-500/40",
                "hover:bg-moroccan-gold-100 disabled:opacity-60",
              )}
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              {aiPending ? "…" : t("aiGenerate")}
            </button>
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            rows={5}
            maxLength={2000}
            className="rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Secteur — only when the chosen city has secteurs */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("phone")}>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212 5 22 00 00 00"
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label={t("whatsapp")}>
            <Input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+212 6 00 00 00 00"
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label={t("email")}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label={t("website")}>
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label={t("facebook")}>
            <Input
              type="url"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/..."
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label={t("instagram")}>
            <Input
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/..."
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label={t("youtube")}>
            <Input
              type="url"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder="https://youtube.com/..."
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label={t("tiktok")}>
            <Input
              type="url"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="https://tiktok.com/@..."
              className="h-11 rounded-xl"
            />
          </Field>
          <Field label={t("linkedin")}>
            <Input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/company/..."
              className="h-11 rounded-xl"
            />
          </Field>
        </div>
      </Card>

      {/* Location */}
      <Card as="section" padding="none" className="p-6 space-y-4">
        <h3 className="font-semibold text-foreground">{t("location")}</h3>
        <MapPicker
          latitude={lat}
          longitude={lng}
          onChange={(la, ln) => {
            setLat(la)
            setLng(ln)
          }}
        />
      </Card>

      {/* Opening hours */}
      <Card as="section" padding="none" className="p-6 space-y-3">
        <header>
          <h3 className="font-semibold text-foreground">{tHours("title")}</h3>
          <p className="text-xs text-muted-foreground">{tHours("subtitle")}</p>
        </header>
        <OpeningHoursEditor value={hours} onChange={setHours} />
      </Card>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all disabled:opacity-60"
        >
          <Save className="size-4" aria-hidden="true" />
          {pending ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  help,
  children,
}: {
  label: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  )
}

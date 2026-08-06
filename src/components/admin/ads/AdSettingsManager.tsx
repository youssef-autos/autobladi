"use client"

import { useState, useTransition } from "react"
import {
  Check,
  LayoutGrid,
  Megaphone,
  Monitor,
  Save,
  Smartphone,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  saveAdsenseClientId,
  updateAdSlotSettings,
} from "@/app/[locale]/admin/ads/actions"
import { Badge } from "@/components/ui/badge"
import type { AdSlotSettingsRow } from "@/lib/queries/admin"

type Props = {
  slots: AdSlotSettingsRow[]
  adsenseClientId: string
}

export function AdSettingsManager({ slots, adsenseClientId }: Props) {
  return (
    <div className="space-y-6">
      <AdsenseCard initial={adsenseClientId} />
      <div className="space-y-4">
        {slots.map((slot) => (
          <SlotCard key={slot.slug} slot={slot} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Global AdSense publisher id
// ---------------------------------------------------------------------------
function AdsenseCard({ initial }: { initial: string }) {
  const t = useTranslations("adminPanel.placementsPage.adsense")
  const [value, setValue] = useState(initial)
  const [pending, start] = useTransition()
  const configured = value.startsWith("ca-pub-")

  function onSave() {
    start(async () => {
      const res = await saveAdsenseClientId({ adsense_client_id: value.trim() })
      if (!res.ok) {
        toast.error(res.error === "invalid_adsense_id" ? t("invalid") : t("error"))
        return
      }
      toast.success(t("saved"))
    })
  }

  return (
    <section className="rounded-2xl border border-moroccan-gold-500/30 bg-moroccan-gold-50/30 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-moroccan-gold-500/15 text-moroccan-gold-700">
            <Megaphone className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">{t("title")}</h2>
            <p className="text-xs text-muted-foreground">{t("desc")}</p>
          </div>
        </div>
        <Badge variant={configured ? "verified" : "outline"} className="text-[10px] shrink-0">
          {configured ? t("enabled") : t("disabled")}
        </Badge>
      </div>

      <SettingsField label={t("label")}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ca-pub-XXXXXXXXXXXXXXXX"
            dir="ltr"
            className="sm:flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40"
          />
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-moroccan-gold-600 text-white text-sm font-medium hover:bg-moroccan-gold-700 disabled:opacity-50"
          >
            <Save className="size-4" />
            {pending ? t("saving") : t("save")}
          </button>
        </div>
      </SettingsField>
      <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{t("help")}</p>
    </section>
  )
}

// ---------------------------------------------------------------------------
// One ad slot
// ---------------------------------------------------------------------------
function SlotCard({ slot }: { slot: AdSlotSettingsRow }) {
  const t = useTranslations("adminPanel.placementsPage")
  const [pending, start] = useTransition()

  const [form, setForm] = useState({
    name: slot.name,
    is_active: slot.is_active,
    device: slot.device,
    default_provider: slot.default_provider,
    width: String(slot.width),
    height: String(slot.height),
    width_mobile: String(slot.width_mobile),
    height_mobile: String(slot.height_mobile),
    adsense_slot_id: slot.adsense_slot_id,
    lazy: slot.lazy,
  })

  function set<K extends keyof typeof form>(key: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: v }))
  }

  function onSave() {
    start(async () => {
      const res = await updateAdSlotSettings({
        slug: slot.slug,
        name: form.name.trim() || slot.slug,
        is_active: form.is_active,
        device: form.device,
        default_provider: form.default_provider,
        width: Number(form.width),
        height: Number(form.height),
        width_mobile: Number(form.width_mobile),
        height_mobile: Number(form.height_mobile),
        adsense_slot_id: form.adsense_slot_id.trim(),
        lazy: form.lazy,
      })
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.savedSlot"))
    })
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-soft transition-opacity",
        !form.is_active && "opacity-70",
      )}
    >
      {/* Header: label + id + on/off */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <code className="text-xs bg-moroccan-sand-50 rounded-md px-1.5 py-0.5 text-moroccan-red-700 shrink-0">
            {slot.slug}
          </code>
          {slot.ads_count > 0 && (
            <Badge variant="pro" className="text-[10px]">
              {t("activeCampaigns", { count: slot.ads_count })}
            </Badge>
          )}
        </div>
        <Toggle
          on={form.is_active}
          onChange={(v) => set("is_active", v)}
          onLabel={t("fields.on")}
          offLabel={t("fields.off")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Name */}
        <SettingsField label={t("fields.name")} className="sm:col-span-2 lg:col-span-1">
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputCls}
          />
        </SettingsField>

        {/* Device */}
        <SettingsField label={t("columns.device")}>
          <div className="flex gap-1">
            <DeviceOption
              active={form.device === "both"}
              onClick={() => set("device", "both")}
              icon={<LayoutGrid className="size-3.5" />}
              label={t("device.both")}
            />
            <DeviceOption
              active={form.device === "desktop"}
              onClick={() => set("device", "desktop")}
              icon={<Monitor className="size-3.5" />}
              label={t("device.desktop")}
            />
            <DeviceOption
              active={form.device === "mobile"}
              onClick={() => set("device", "mobile")}
              icon={<Smartphone className="size-3.5" />}
              label={t("device.mobile")}
            />
          </div>
        </SettingsField>

        {/* Provider */}
        <SettingsField label={t("fields.provider")}>
          <select
            value={form.default_provider}
            onChange={(e) =>
              set("default_provider", e.target.value as "adsense" | "direct")
            }
            className={inputCls}
          >
            <option value="adsense">{t("provider.adsense")}</option>
            <option value="direct">{t("provider.direct")}</option>
          </select>
        </SettingsField>

        {/* Desktop size */}
        <SettingsField label={t("fields.desktopSize")}>
          <SizePair
            w={form.width}
            h={form.height}
            onW={(v) => set("width", v)}
            onH={(v) => set("height", v)}
          />
        </SettingsField>

        {/* Mobile size */}
        <SettingsField label={t("fields.mobileSize")}>
          <SizePair
            w={form.width_mobile}
            h={form.height_mobile}
            onW={(v) => set("width_mobile", v)}
            onH={(v) => set("height_mobile", v)}
          />
        </SettingsField>

        {/* AdSense unit id */}
        <SettingsField
          label={t("fields.adsenseUnit")}
          className="sm:col-span-2 lg:col-span-1"
        >
          <input
            value={form.adsense_slot_id}
            onChange={(e) => set("adsense_slot_id", e.target.value)}
            placeholder={t("fields.adsenseUnitPlaceholder")}
            dir="ltr"
            className={cn(inputCls, "font-mono")}
          />
        </SettingsField>
      </div>

      {/* Footer: lazy + save */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.lazy}
            onChange={(e) => set("lazy", e.target.checked)}
            className="size-4 rounded border-border accent-moroccan-gold-600"
          />
          {t("fields.lazy")}
        </label>
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-moroccan-red-500 text-white text-sm font-medium hover:bg-moroccan-red-600 disabled:opacity-50"
        >
          {pending ? <Check className="size-4" /> : <Save className="size-4" />}
          {pending ? t("form.saving") : t("form.save")}
        </button>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function SettingsField({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

function SizePair({
  w,
  h,
  onW,
  onH,
}: {
  w: string
  h: string
  onW: (v: string) => void
  onH: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={1}
        max={9999}
        value={w}
        onChange={(e) => onW(e.target.value)}
        className={cn(inputCls, "w-20 text-center")}
      />
      <span className="text-muted-foreground text-xs">×</span>
      <input
        type="number"
        min={1}
        max={9999}
        value={h}
        onChange={(e) => onH(e.target.value)}
        className={cn(inputCls, "w-20 text-center")}
      />
      <span className="text-[11px] text-muted-foreground">px</span>
    </div>
  )
}

function DeviceOption({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1 h-9 rounded-lg border text-xs font-medium transition-colors",
        active
          ? "border-moroccan-gold-500 bg-moroccan-gold-50 text-moroccan-gold-700"
          : "border-border bg-background text-muted-foreground hover:bg-moroccan-sand-50",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function Toggle({
  on,
  onChange,
  onLabel,
  offLabel,
}: {
  on: boolean
  onChange: (v: boolean) => void
  onLabel: string
  offLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2 text-xs font-medium"
    >
      <span
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          on ? "bg-moroccan-mint-500" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 transform rounded-full bg-white shadow transition-transform",
            on ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5 rtl:-translate-x-0.5",
          )}
        />
      </span>
      <span className={on ? "text-moroccan-mint-600" : "text-muted-foreground"}>
        {on ? onLabel : offLabel}
      </span>
    </button>
  )
}

const inputCls =
  "h-9 w-full px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold-500/40 focus:border-moroccan-gold-500/60"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

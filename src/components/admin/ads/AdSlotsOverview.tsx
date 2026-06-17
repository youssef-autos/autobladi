import { LayoutGrid, Monitor, Smartphone } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ADSENSE, getAllAdSlots, type AdDevice } from "@/config/ads.config"

/**
 * Read-only overview of every ad *slot* defined in `config/ads.config.ts`.
 * Complements <PlacementsManager/> (which manages DB visibility + campaigns):
 * this table shows the code-level wiring — device, per-device sizes, default
 * network, and AdSense unit status — so admins see the full picture at a glance.
 */
export function AdSlotsOverview({ locale }: { locale: string }) {
  const ar = locale === "ar"
  const slots = getAllAdSlots()

  const tx = {
    title: ar ? "خانات الإعلانات (التكوين)" : "Emplacements publicitaires (config)",
    subtitle: ar
      ? "تعريفات الخانات من ملف الكود — المقاسات والجهاز والشبكة الافتراضية."
      : "Définitions issues du code — tailles, appareil et réseau par défaut.",
    adsenseOn: ar ? "AdSense مفعّل" : "AdSense actif",
    adsenseOff: ar ? "AdSense غير مُهيّأ" : "AdSense non configuré",
    cols: {
      id: ar ? "المعرّف" : "Identifiant",
      label: ar ? "الموقع" : "Emplacement",
      device: ar ? "الجهاز" : "Appareil",
      desktop: ar ? "ويب" : "Bureau",
      mobile: ar ? "هاتف" : "Mobile",
      provider: ar ? "الشبكة" : "Réseau",
      adsense: ar ? "وحدة AdSense" : "Unité AdSense",
      status: ar ? "الحالة" : "Statut",
    },
    enabled: ar ? "مفعّل" : "Activé",
    disabled: ar ? "معطّل" : "Désactivé",
    notSet: ar ? "غير محدّد" : "Non défini",
  }

  return (
    <section className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
      <header className="px-4 py-4 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">{tx.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{tx.subtitle}</p>
        </div>
        <Badge
          variant={ADSENSE.enabled ? "pro" : "outline"}
          className="text-[10px] shrink-0"
        >
          {ADSENSE.enabled ? tx.adsenseOn : tx.adsenseOff}
        </Badge>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-start px-4 py-3">{tx.cols.id}</th>
              <th className="text-start px-4 py-3">{tx.cols.label}</th>
              <th className="text-start px-4 py-3 w-24">{tx.cols.device}</th>
              <th className="text-start px-4 py-3 w-24">{tx.cols.desktop}</th>
              <th className="text-start px-4 py-3 w-24">{tx.cols.mobile}</th>
              <th className="text-start px-4 py-3 w-24">{tx.cols.provider}</th>
              <th className="text-start px-4 py-3 w-28">{tx.cols.adsense}</th>
              <th className="text-start px-4 py-3 w-24">{tx.cols.status}</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr
                key={slot.id}
                className="border-t border-border hover:bg-moroccan-sand-50/30 transition-colors"
              >
                <td className="px-4 py-3 align-middle">
                  <code className="text-xs bg-moroccan-sand-50 rounded-md px-1.5 py-0.5 text-moroccan-red-700">
                    {slot.id}
                  </code>
                </td>
                <td className="px-4 py-3 align-middle text-sm text-foreground">
                  {slot.label}
                </td>
                <td className="px-4 py-3 align-middle">
                  <DeviceBadge device={slot.device} ar={ar} />
                </td>
                <td className="px-4 py-3 align-middle text-xs font-mono text-muted-foreground">
                  {slot.sizes.desktop.width}×{slot.sizes.desktop.height}
                </td>
                <td className="px-4 py-3 align-middle text-xs font-mono text-muted-foreground">
                  {slot.sizes.mobile.width}×{slot.sizes.mobile.height}
                </td>
                <td className="px-4 py-3 align-middle">
                  <Badge
                    variant={slot.defaultProvider === "adsense" ? "outline" : "pro"}
                    className="text-[10px] uppercase"
                  >
                    {slot.defaultProvider}
                  </Badge>
                </td>
                <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                  {slot.adsenseSlotId ? (
                    <code className="font-mono">{slot.adsenseSlotId}</code>
                  ) : (
                    tx.notSet
                  )}
                </td>
                <td className="px-4 py-3 align-middle">
                  {slot.enabled ? (
                    <Badge variant="verified" className="text-[10px]">
                      {tx.enabled}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground"
                    >
                      {tx.disabled}
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function DeviceBadge({ device, ar }: { device: AdDevice; ar: boolean }) {
  if (device === "mobile") {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] border-blue-400/50 text-blue-600">
        <Smartphone className="size-3" />
        {ar ? "هاتف" : "Mobile"}
      </Badge>
    )
  }
  if (device === "desktop") {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] border-moroccan-gold-500/50 text-moroccan-gold-700">
        <Monitor className="size-3" />
        {ar ? "ويب" : "Bureau"}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
      <LayoutGrid className="size-3" />
      {ar ? "الكل" : "Tous"}
    </Badge>
  )
}

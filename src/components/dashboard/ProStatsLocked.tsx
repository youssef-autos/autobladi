import { BarChart3, Lock, TrendingUp } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"

/**
 * Teaser shown to FREE accounts under their (unchanged) dashboard stats:
 * a blurred fake preview of the advanced statistics with a lock overlay and
 * an "upgrade to Pro" CTA. Pure decoration — no real data behind the blur.
 */
export async function ProStatsLocked() {
  const t = await getTranslations("dashboard.advancedStats")

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      {/* Decorative blurred preview */}
      <div className="p-6 blur-[6px] select-none pointer-events-none" aria-hidden="true">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[64, 23, 12, "9%"].map((v, i) => (
            <div key={i} className="rounded-2xl border border-border p-4">
              <div className="h-2.5 w-16 rounded bg-moroccan-sand-100 mb-3" />
              <p className="font-display text-2xl font-bold text-foreground tabular-nums">{v}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border p-4 h-40 flex items-end gap-2">
          {[35, 55, 40, 70, 62, 88, 74, 95, 80, 60, 72, 90].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-moroccan-red-500/70"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <span className="inline-flex items-center justify-center size-14 rounded-2xl bg-moroccan-gradient text-white shadow-moroccan">
            <Lock className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-foreground inline-flex items-center gap-2">
              <BarChart3 className="size-5 text-moroccan-gold-600" aria-hidden="true" />
              {t("locked.title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("locked.desc")}
            </p>
          </div>
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all"
          >
            <TrendingUp className="size-4" aria-hidden="true" />
            {t("locked.cta")}
          </Link>
        </div>
      </div>
    </section>
  )
}

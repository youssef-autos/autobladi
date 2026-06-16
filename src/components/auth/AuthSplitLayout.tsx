import { getTranslations } from "next-intl/server"
import { Car, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react"

import { Logo } from "@/components/layout/Logo"
import { cn } from "@/lib/utils"

type Props = {
  children: React.ReactNode
  className?: string
}

/**
 * Two-pane auth shell. The decorative pane (desktop only) is a fully
 * self-contained brand panel — no photography. It layers a deep Moroccan
 * maroon→black gradient, a tiled zellige (8-point star) motif, a faint car
 * watermark, and two slowly drifting gold/red orbs behind the wordmark,
 * value props, and headline stats. The form pane stays clean so the inputs
 * lead. RTL is handled by logical `start/end` utilities + the html `dir`.
 */
export async function AuthSplitLayout({ children, className }: Props) {
  const t = await getTranslations("auth.hero")

  const features = [
    { icon: Sparkles, label: t("features.ai") },
    { icon: ShieldCheck, label: t("features.verified") },
    { icon: MessagesSquare, label: t("features.secure") },
  ]

  const stats = [
    { value: t("stats.cars"), label: t("stats.carsLabel") },
    { value: t("stats.dealers"), label: t("stats.dealersLabel") },
    { value: t("stats.cities"), label: t("stats.citiesLabel") },
  ]

  return (
    <div className="min-h-dvh w-full grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] bg-background">
      {/* ── Brand pane (desktop) ───────────────────────────────── */}
      <aside
        className="relative hidden lg:flex flex-col overflow-hidden text-white"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #7d1519 0%, #4a0c0e 52%, #1a0506 100%)",
        }}
      >
        {/* Zellige tile motif */}
        <svg
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="zellige"
              width="68"
              height="68"
              patternUnits="userSpaceOnUse"
            >
              <g
                fill="none"
                stroke="#e5c547"
                strokeWidth="1"
                strokeOpacity="0.5"
              >
                <polygon points="34,6 62,34 34,62 6,34" />
                <rect x="13" y="13" width="42" height="42" />
                <circle cx="34" cy="34" r="2.5" fill="#e5c547" stroke="none" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#zellige)" opacity="0.13" />
        </svg>

        {/* Radial gold glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(120% 80% at 50% -10%, rgba(229,197,71,0.18) 0%, transparent 55%)",
          }}
        />

        {/* Drifting orbs */}
        <div
          aria-hidden="true"
          className="auth-orb-a absolute -top-24 end-[-70px] size-72 rounded-full bg-moroccan-gold-500/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="auth-orb-b absolute bottom-[-90px] start-[-50px] size-80 rounded-full bg-moroccan-red-500/40 blur-3xl"
        />

        {/* Oversized car watermark */}
        <Car
          aria-hidden="true"
          strokeWidth={1}
          className="absolute -bottom-12 end-[-40px] size-[440px] text-white/[0.035] rotate-6"
        />

        {/* Top gold hairline */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-moroccan-gold-500 via-moroccan-gold-500/60 to-transparent"
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          {/* Header: logo + badge */}
          <div className="flex items-center justify-between gap-4">
            <Logo variant="light" size="lg" />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-moroccan-gold-500" />
              {t("badge")}
            </span>
          </div>

          {/* Middle: headline + features */}
          <div className="max-w-md space-y-8">
            <div className="space-y-4">
              <h2 className="font-display text-4xl xl:text-5xl font-bold leading-[1.15]">
                {t("headline")}
              </h2>
              <div className="h-1 w-16 rounded-full bg-moroccan-gold-500" />
              <p className="text-base xl:text-lg leading-relaxed text-white/75">
                {t("subline")}
              </p>
            </div>

            <ul className="space-y-4">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-moroccan-gold-500/15 text-moroccan-gold-500 ring-1 ring-inset ring-moroccan-gold-500/30">
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <span className="font-medium text-white/90">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer: stats */}
          <div className="space-y-5">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <dl className="grid grid-cols-3 gap-4">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <dt className="font-display text-2xl xl:text-3xl font-bold text-moroccan-gold-500">
                    {value}
                  </dt>
                  <dd className="mt-1 text-xs leading-snug text-white/60">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </aside>

      {/* ── Form pane ──────────────────────────────────────────── */}
      <div
        className={cn(
          "relative flex items-center justify-center p-6 sm:p-10",
          className,
        )}
      >
        {/* Mobile-only gold hairline echoing the brand pane */}
        <div
          aria-hidden="true"
          className="lg:hidden absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-moroccan-red-500 via-moroccan-gold-500 to-moroccan-red-500"
        />
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

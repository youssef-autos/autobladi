import { Home, Search } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Logo } from "@/components/layout/Logo"
import { Link } from "@/i18n/navigation"
import { getSiteLogos } from "@/lib/queries/home"

export default async function NotFound() {
  const [t, logos] = await Promise.all([
    getTranslations("notFound"),
    getSiteLogos().catch(() => ({ light: null, dark: null })),
  ])

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-dark px-6 py-16 text-center text-white">
      {/* Decorative gold glow */}
      <div
        className="absolute -top-24 start-1/2 -z-10 size-96 -translate-x-1/2 rounded-full bg-moroccan-gold-500/10 blur-3xl"
        aria-hidden="true"
      />

      <Logo variant="light" size="lg" className="mb-10" imageUrl={logos.dark} />

      <p className="font-display text-7xl md:text-9xl font-bold leading-none text-moroccan-gold-500 tabular-nums">
        404
      </p>

      <h1 className="mt-6 font-display text-2xl md:text-3xl font-bold">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-md text-white/70 leading-relaxed">
        {t("subtitle")}
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-moroccan-gradient text-sm font-semibold text-white shadow-moroccan hover:brightness-105 transition-all"
        >
          <Home className="size-4" aria-hidden="true" />
          {t("home")}
        </Link>
        <Link
          href="/annonces"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
        >
          <Search className="size-4" aria-hidden="true" />
          {t("browse")}
        </Link>
      </div>
    </main>
  )
}

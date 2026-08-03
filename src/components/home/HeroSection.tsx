import { getLocale, getTranslations } from "next-intl/server"

import { QuickSearch } from "@/components/home/QuickSearch"
import { Container } from "@/components/ui/Container"
import { getActiveAnnoncesCount, getCities, type Brand, type CarModel } from "@/lib/queries/home"

type Props = {
  brands: Brand[]
  models: CarModel[]
}

export async function HeroSection({ brands, models }: Props) {
  const t = await getTranslations("home.hero")
  const locale = await getLocale()
  const [annoncesCount, cities] = await Promise.all([
    getActiveAnnoncesCount(),
    getCities(),
  ])

  // Real count, formatted with Latin digits (consistent with the listings UI).
  const nf = new Intl.NumberFormat(
    locale === "ar" ? "ar-MA-u-nu-latn" : "fr-FR",
  )
  const annoncesFmt = nf.format(annoncesCount)

  return (
    <section className="relative">
      {/* Branded hero panel — its own box so the floating search card below
          can overlap its bottom edge while sitting on the page's white bg. */}
      <div className="relative isolate overflow-hidden bg-brand-dark">
        <div
          className="absolute inset-0 -z-20 bg-gradient-to-br from-brand-dark via-[#241512] to-brand-dark"
          aria-hidden="true"
        />
        <ZelligePattern className="absolute inset-0 -z-10 text-white opacity-[0.05]" />
        <div
          className="absolute -top-28 start-1/4 -z-10 size-[26rem] rounded-full bg-moroccan-gold-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 end-0 -z-10 size-[28rem] rounded-full bg-moroccan-red-500/15 blur-3xl"
          aria-hidden="true"
        />

        <Container className="relative pt-14 md:pt-20 lg:pt-24 pb-24 md:pb-28 lg:pb-32">
          <div className="max-w-2xl text-white">
            <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1]">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-xl text-base md:text-lg text-white/75 leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </Container>
      </div>

      {/* Search card — floats over the panel's lower edge, spills onto the
          page's white background beneath it. */}
      <div className="relative z-10 -mt-16 md:-mt-20 lg:-mt-24 pb-10 md:pb-14">
        <Container>
          <QuickSearch
            brands={brands}
            models={models}
            cities={cities}
            count={annoncesFmt}
          />
        </Container>
      </div>
    </section>
  )
}

/** Subtle interlocking-star lattice, evoking Moroccan zellige tilework. */
function ZelligePattern({ className }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true">
      <defs>
        <pattern
          id="zellige-lattice"
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(15)"
        >
          <path
            d="M32 2 L62 32 L32 62 L2 32 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M32 16 L48 32 L32 48 L16 32 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle cx="32" cy="32" r="2" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#zellige-lattice)" />
    </svg>
  )
}

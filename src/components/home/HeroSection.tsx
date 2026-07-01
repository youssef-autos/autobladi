import { getLocale, getTranslations } from "next-intl/server"

import { QuickSearch } from "@/components/home/QuickSearch"
import { Container } from "@/components/ui/Container"
import { getHomeCounts, type Brand, type CarModel } from "@/lib/queries/home"

type Props = {
  brands: Brand[]
  models: CarModel[]
}

export async function HeroSection({ brands, models }: Props) {
  const t = await getTranslations("home.hero")
  const locale = await getLocale()
  const counts = await getHomeCounts()

  // Real counts, formatted with Latin digits (consistent with the listings UI).
  const nf = new Intl.NumberFormat(
    locale === "ar" ? "ar-MA-u-nu-latn" : "fr-FR",
  )
  const annoncesFmt = nf.format(counts.annonces)
  const dealersFmt = nf.format(counts.dealers)
  const citiesFmt = nf.format(counts.cities)

  return (
    <section className="relative isolate overflow-hidden bg-brand-dark">
      {/* Background image */}
      <div className="absolute inset-0 -z-20">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url(/images/hero.jpg)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/85 to-brand-dark/40 rtl:bg-gradient-to-l rtl:from-brand-dark rtl:via-brand-dark/85 rtl:to-brand-dark/40"
          aria-hidden="true"
        />
      </div>

      {/* Decorative gold glow */}
      <div
        className="absolute -top-24 start-1/3 -z-10 size-96 rounded-full bg-moroccan-gold-500/10 blur-3xl"
        aria-hidden="true"
      />

      <Container className="relative py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Title + motivational line — on the side */}
          <div className="text-white space-y-6 max-w-xl">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1]">
              {t("title")}
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-white/80 leading-relaxed">
              {t("subtitle")}
            </p>

            {/* Real stats */}
            <dl className="flex items-center divide-x divide-white/10 rtl:divide-x-reverse pt-2">
              <Stat value={annoncesFmt} label={t("statsCars")} first />
              <Stat value={dealersFmt} label={t("statsDealers")} />
              <Stat value={citiesFmt} label={t("statsCities")} />
            </dl>
          </div>

          {/* Search card — on the other side */}
          <div className="w-full lg:justify-self-end">
            <QuickSearch brands={brands} models={models} count={annoncesFmt} />
          </div>
        </div>
      </Container>
    </section>
  )
}

function Stat({
  value,
  label,
  first,
}: {
  value: string
  label: string
  first?: boolean
}) {
  return (
    <div className={`flex flex-col ${first ? "pe-5 sm:pe-8" : "px-5 sm:px-8"}`}>
      <dt className="text-xs text-white/65 mt-1 order-last">{label}</dt>
      <dd className="font-display text-2xl md:text-3xl font-bold text-moroccan-gold-500 tabular-nums order-first">
        {value}
      </dd>
    </div>
  )
}

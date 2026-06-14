import type { Metadata } from "next"
import { Banknote, Car, Sparkles, MapPin, type LucideIcon } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { EstimationPanel } from "@/components/estimation/EstimationPanel"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { getActiveBrands, getActiveModels } from "@/lib/queries/home"
import type { Locale } from "@/i18n/routing"
import { localeAlternates } from "@/lib/seo/alternates"
import { JsonLd as JsonLdScript } from "@/components/seo/JsonLd"
import { faqSchema } from "@/lib/seo/structured-data"

const FAQ_KEYS = ["1", "2", "3", "4"] as const

export const dynamic = "force-static"
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "estimation" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localeAlternates(locale, `/estimation`),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  }
}

export default async function EstimationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("estimation")

  const [brands, models] = await Promise.all([
    getActiveBrands(),
    getActiveModels(),
  ])

  return (
    <>
      <section className="relative bg-subtle-pattern py-12 md:py-20">
        <Container className="max-w-5xl">
          {/* Hero */}
          <header className="text-center space-y-4 max-w-2xl mx-auto mb-10 md:mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-moroccan-gold-50 px-3 py-1 text-xs font-semibold text-moroccan-gold-700 border border-moroccan-gold-500/30">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {t("hero.badge")}
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              {t("hero.title")}
            </h1>
            <GoldAccent className="mx-auto" />
            <p className="text-muted-foreground text-base md:text-lg">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <TrustChip icon={Banknote}>{t("hero.trustFree")}</TrustChip>
              <TrustChip icon={Sparkles}>{t("hero.trustInstant")}</TrustChip>
              <TrustChip icon={MapPin}>{t("hero.trustLocal")}</TrustChip>
            </div>
          </header>

          {/* Split: form + result */}
          <EstimationPanel
            brands={brands}
            models={models}
            locale={locale as Locale}
          />

          <p className="mt-8 text-xs text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed">
            {t("disclaimer")}
          </p>
        </Container>
      </section>

      <StepsSection />

      <WhyUsSection />

      <FaqSection />

      <JsonLd locale={locale} t={t} />
    </>
  )
}

function TrustChip({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
      <Icon className="size-3.5 text-moroccan-mint-500" aria-hidden="true" />
      {children}
    </span>
  )
}

async function StepsSection() {
  const t = await getTranslations("estimation.steps")
  const steps: Array<{ icon: LucideIcon; title: string; desc: string }> = [
    { icon: Car, title: t("s1Title"), desc: t("s1Desc") },
    { icon: Sparkles, title: t("s2Title"), desc: t("s2Desc") },
    { icon: Banknote, title: t("s3Title"), desc: t("s3Desc") },
  ]

  return (
    <section className="py-12 md:py-16 bg-moroccan-sand-50/50">
      <Container className="max-w-5xl">
        <header className="text-center space-y-3 mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold">{t("title")}</h2>
          <GoldAccent className="mx-auto" />
          <p className="text-muted-foreground max-w-xl mx-auto">{t("subtitle")}</p>
        </header>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <li
              key={title}
              className="relative rounded-2xl border border-border bg-card p-6 pt-7 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-moroccan-gold-500/40 hover:shadow-soft"
            >
              <span className="absolute -top-3 start-6 inline-flex size-7 items-center justify-center rounded-full bg-moroccan-gradient text-sm font-bold text-white shadow-moroccan">
                {i + 1}
              </span>
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-moroccan-gold-50 text-moroccan-gold-600 mb-3">
                <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

async function WhyUsSection() {
  const t = await getTranslations("estimation.why")
  const items: Array<{ icon: LucideIcon; title: string; desc: string }> = [
    { icon: Banknote, title: t("freeTitle"), desc: t("freeDesc") },
    { icon: Sparkles, title: t("instantTitle"), desc: t("instantDesc") },
    { icon: MapPin, title: t("localTitle"), desc: t("localDesc") },
  ]

  return (
    <section className="py-12 md:py-16">
      <Container className="max-w-5xl">
        <header className="text-center space-y-3 mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            {t("title")}
          </h2>
          <GoldAccent className="mx-auto" />
          <p className="text-muted-foreground max-w-xl mx-auto">{t("subtitle")}</p>
        </header>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-card text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-moroccan-gold-500/40 hover:shadow-soft"
            >
              <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-moroccan-red-50 text-moroccan-red-500 mb-4">
                <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

async function FaqSection() {
  const t = await getTranslations("estimation.faq")
  return (
    <section className="py-12 md:py-16 bg-moroccan-sand-50/50">
      <Container className="max-w-3xl">
        <header className="text-center space-y-3 mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold">
            {t("title")}
          </h2>
          <GoldAccent className="mx-auto" />
        </header>
        <div className="space-y-3">
          {FAQ_KEYS.map((n) => (
            <details
              key={n}
              className="group rounded-2xl border border-border bg-card px-5 py-4 shadow-card [&_summary]:cursor-pointer"
            >
              <summary className="flex items-center justify-between gap-3 font-semibold text-foreground list-none">
                {t(`q${n}`)}
                <span className="text-moroccan-red-500 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {t(`a${n}`)}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}

type T = Awaited<ReturnType<typeof getTranslations<"estimation">>>

function JsonLd({ locale, t }: { locale: string; t: T }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"
  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: t("metaTitle"),
    description: t("metaDescription"),
    url: `${siteUrl}/${locale}/estimation`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "MAD" },
    inLanguage: locale,
    isAccessibleForFree: true,
  }
  const faq = faqSchema(
    FAQ_KEYS.map((n) => ({
      question: t(`faq.q${n}`),
      answer: t(`faq.a${n}`),
    })),
  )
  return <JsonLdScript data={[webApp, faq]} />
}

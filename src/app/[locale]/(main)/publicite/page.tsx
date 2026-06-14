import type { Metadata } from "next"
import {
  BarChart3,
  Building2,
  Eye,
  Globe2,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Newspaper,
  Phone,
  Sparkles,
  Users,
} from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AdInquiryForm } from "@/components/publicite/AdInquiryForm"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { localeAlternates } from "@/lib/seo/alternates"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "publicite" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localeAlternates(locale, `/publicite`),
    // Page is publicly accessible (linked only from the footer), but we
    // don't want it surfacing alongside core product pages in search.
    robots: { index: false, follow: true },
  }
}

export default async function PublicitePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("publicite")

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-moroccan-gradient text-white">
        <div
          className="absolute -end-24 -top-24 size-72 rounded-full bg-moroccan-gold-500/25 blur-3xl"
          aria-hidden="true"
        />
        <Container className="relative py-16 md:py-24">
          <div className="max-w-3xl space-y-5">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-moroccan-gold-500">
              <Megaphone className="size-4" aria-hidden="true" />
              {t("hero.eyebrow")}
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-white/85 max-w-2xl">
              {t("hero.subtitle")}
            </p>
            <div className="pt-2">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-moroccan-gold-500 text-brand-dark text-sm font-semibold hover:bg-moroccan-gold-400 transition-colors"
              >
                {t("hero.cta")}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Audience stats */}
      <section className="py-12 md:py-16 bg-moroccan-sand-50/60">
        <Container>
          <header className="text-center space-y-2 max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {t("audience.title")}
            </h2>
            <GoldAccent className="mx-auto" />
            <p className="text-sm text-muted-foreground">{t("audience.subtitle")}</p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Eye}
              value={t("audience.visitsValue")}
              label={t("audience.visitsLabel")}
            />
            <StatCard
              icon={Newspaper}
              value={t("audience.annoncesValue")}
              label={t("audience.annoncesLabel")}
            />
            <StatCard
              icon={Building2}
              value={t("audience.dealersValue")}
              label={t("audience.dealersLabel")}
            />
            <StatCard
              icon={MapPin}
              value={t("audience.citiesValue")}
              label={t("audience.citiesLabel")}
            />
          </div>
        </Container>
      </section>

      {/* Placements */}
      <section className="py-12 md:py-16">
        <Container>
          <header className="text-center space-y-2 max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {t("placements.title")}
            </h2>
            <GoldAccent className="mx-auto" />
            <p className="text-sm text-muted-foreground">
              {t("placements.subtitle")}
            </p>
          </header>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <PlacementCard
              icon={Sparkles}
              title={t("placements.items.home")}
              desc={t("placements.items.homeDesc")}
            />
            <PlacementCard
              icon={Newspaper}
              title={t("placements.items.listings")}
              desc={t("placements.items.listingsDesc")}
            />
            <PlacementCard
              icon={Eye}
              title={t("placements.items.annonce")}
              desc={t("placements.items.annonceDesc")}
            />
            <PlacementCard
              icon={Building2}
              title={t("placements.items.professionnel")}
              desc={t("placements.items.professionnelDesc")}
            />
            <PlacementCard
              icon={MessageCircle}
              title={t("placements.items.blog")}
              desc={t("placements.items.blogDesc")}
            />
            <PlacementCard
              icon={Megaphone}
              title={t("placements.items.footer")}
              desc={t("placements.items.footerDesc")}
            />
          </ul>
        </Container>
      </section>

      {/* Why us */}
      <section className="py-12 md:py-16 bg-moroccan-sand-50/60">
        <Container>
          <header className="text-center space-y-2 max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {t("why.title")}
            </h2>
            <GoldAccent className="mx-auto" />
            <p className="text-sm text-muted-foreground">{t("why.subtitle")}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <WhyCard
              icon={Users}
              title={t("why.audienceTitle")}
              desc={t("why.audienceDesc")}
            />
            <WhyCard
              icon={Globe2}
              title={t("why.localTitle")}
              desc={t("why.localDesc")}
            />
            <WhyCard
              icon={BarChart3}
              title={t("why.transparentTitle")}
              desc={t("why.transparentDesc")}
            />
          </div>
        </Container>
      </section>

      {/* Contact + form */}
      <section id="contact" className="py-12 md:py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
            <AdInquiryForm />

            <aside className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
              <header>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {t("contact.title")}
                </h3>
                <GoldAccent className="mt-2" />
              </header>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center size-9 rounded-full bg-moroccan-gold-500/15 text-moroccan-gold-700">
                    <Mail className="size-4" aria-hidden="true" />
                  </span>
                  <a
                    href={`mailto:${t("contact.email")}`}
                    className="text-foreground hover:text-moroccan-red-500 transition-colors"
                  >
                    {t("contact.email")}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center size-9 rounded-full bg-moroccan-gold-500/15 text-moroccan-gold-700">
                    <Phone className="size-4" aria-hidden="true" />
                  </span>
                  <a
                    href={`tel:${t("contact.phone").replace(/\s/g, "")}`}
                    className="text-foreground hover:text-moroccan-red-500 transition-colors"
                  >
                    {t("contact.phone")}
                  </a>
                </li>
              </ul>
            </aside>
          </div>
        </Container>
      </section>
    </>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  value: string
  label: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card text-center">
      <Icon className="size-6 text-moroccan-gold-600 mx-auto mb-2" aria-hidden />
      <p className="font-display text-2xl md:text-3xl font-bold text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function PlacementCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  title: string
  desc: string
}) {
  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-card hover:border-moroccan-gold-500/40 transition-colors">
      <Icon className="size-6 text-moroccan-red-500 mb-3" aria-hidden />
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </li>
  )
}

function WhyCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  title: string
  desc: string
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-card text-center space-y-2">
      <Icon className="size-8 text-moroccan-gold-600 mx-auto" aria-hidden />
      <p className="font-display text-lg font-bold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

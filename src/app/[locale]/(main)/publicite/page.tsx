import type { Metadata } from "next"
import {
  ArrowRight,
  BarChart3,
  Building2,
  Clock,
  Eye,
  Filter,
  Globe2,
  Handshake,
  LayoutGrid,
  Mail,
  Megaphone,
  MessageCircle,
  Newspaper,
  Phone,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { AdInquiryForm } from "@/components/publicite/AdInquiryForm"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { getAllAdSlots } from "@/config/ads.config"
import { getSiteContact } from "@/lib/queries/home"
import { localeAlternates } from "@/lib/seo/alternates"

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "publicite" })
  const title = t("metaTitle")
  const description = t("metaDescription")
  return {
    title,
    description,
    alternates: localeAlternates(locale, `/publicite`),
    // Page is publicly accessible (linked only from the footer), but we
    // don't want it surfacing alongside core product pages in search.
    robots: { index: false, follow: true },
    openGraph: { title, description, type: "website" },
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
  const contact = await getSiteContact()

  // Real, verifiable count of live ad slots — never a marketing guess.
  const placementCount = getAllAdSlots().filter((s) => s.enabled).length

  const trustItems = [
    {
      icon: LayoutGrid,
      title: t("trust.placementsTitle", { count: placementCount }),
      desc: t("trust.placementsDesc"),
    },
    { icon: Target, title: t("trust.intentTitle"), desc: t("trust.intentDesc") },
    { icon: ShieldCheck, title: t("trust.safeTitle"), desc: t("trust.safeDesc") },
    { icon: Clock, title: t("trust.responseTitle"), desc: t("trust.responseDesc") },
  ]

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-moroccan-gradient text-white">
        <div
          className="absolute -end-24 -top-24 size-72 rounded-full bg-moroccan-gold-500/25 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <Container className="relative py-16 md:py-24">
          <div className="max-w-3xl space-y-5">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-moroccan-gold-500">
              <Megaphone className="size-4" aria-hidden="true" />
              {t("hero.eyebrow")}
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.15]">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-white/85 max-w-2xl leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <p className="inline-flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="size-4 text-moroccan-gold-400" aria-hidden="true" />
              {t("hero.trust")}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-moroccan-gold-500 text-brand-dark text-sm font-semibold hover:bg-moroccan-gold-400 transition-colors shadow-moroccan"
              >
                {t("hero.cta")}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </a>
              <a
                href="#placements"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-white/25 bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                {t("hero.ctaSecondary")}
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Trust strip (overlaps hero) ──────────────────────── */}
      <Container className="relative z-10 -mt-10 md:-mt-12">
        <div className="rounded-2xl border border-border bg-card shadow-card p-6 md:p-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-5 sm:gap-y-6">
            {trustItems.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center size-10 rounded-xl bg-moroccan-gold-500/10 text-moroccan-gold-600 shrink-0">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground leading-snug">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* ── Why us ───────────────────────────────────────────── */}
      <section className="py-14 md:py-20">
        <Container>
          <header className="text-center space-y-2 max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {t("why.title")}
            </h2>
            <GoldAccent className="mx-auto" />
            <p className="text-sm text-muted-foreground">{t("why.subtitle")}</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <WhyCard
              icon={Filter}
              title={t("why.targetingTitle")}
              desc={t("why.targetingDesc")}
            />
            <WhyCard
              icon={Handshake}
              title={t("why.directTitle")}
              desc={t("why.directDesc")}
            />
            <WhyCard
              icon={BarChart3}
              title={t("why.trackingTitle")}
              desc={t("why.trackingDesc")}
            />
            <WhyCard
              icon={Globe2}
              title={t("why.localTitle")}
              desc={t("why.localDesc")}
            />
          </div>
        </Container>
      </section>

      {/* ── Placements ───────────────────────────────────────── */}
      <section id="placements" className="py-14 md:py-20 bg-moroccan-sand-50/60 scroll-mt-20">
        <Container>
          <header className="text-center space-y-2 max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {t("placements.title")}
            </h2>
            <GoldAccent className="mx-auto" />
            <p className="text-sm text-muted-foreground">
              {t("placements.subtitle", { count: placementCount })}
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
              title={t("placements.items.showroom")}
              desc={t("placements.items.showroomDesc")}
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

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="py-14 md:py-20">
        <Container>
          <header className="text-center space-y-2 max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {t("how.title")}
            </h2>
            <GoldAccent className="mx-auto" />
            <p className="text-sm text-muted-foreground">{t("how.subtitle")}</p>
          </header>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StepCard n={1} title={t("how.step1Title")} desc={t("how.step1Desc")} />
            <StepCard n={2} title={t("how.step2Title")} desc={t("how.step2Desc")} />
            <StepCard n={3} title={t("how.step3Title")} desc={t("how.step3Desc")} />
          </ol>
        </Container>
      </section>

      {/* ── Contact + form ───────────────────────────────────── */}
      <section id="contact" className="py-14 md:py-20 bg-moroccan-sand-50/60 scroll-mt-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            <AdInquiryForm />

            <aside className="rounded-2xl bg-brand-dark text-white p-6 md:p-7 shadow-moroccan space-y-6">
              <header className="space-y-2">
                <h3 className="font-display text-lg font-bold">
                  {t("contact.title")}
                </h3>
                <p className="text-sm text-white/70">{t("contact.subtitle")}</p>
              </header>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center size-9 rounded-full bg-moroccan-gold-500/15 text-moroccan-gold-400 shrink-0">
                    <Mail className="size-4" aria-hidden="true" />
                  </span>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-white/90 hover:text-moroccan-gold-400 transition-colors break-all"
                  >
                    {contact.email}
                  </a>
                </li>
                {contact.phone && (
                  <li className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center size-9 rounded-full bg-moroccan-gold-500/15 text-moroccan-gold-400 shrink-0">
                      <Phone className="size-4" aria-hidden="true" />
                    </span>
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      className="text-white/90 hover:text-moroccan-gold-400 transition-colors"
                      dir="ltr"
                    >
                      {contact.phone}
                    </a>
                  </li>
                )}
              </ul>

              <p className="flex items-center gap-2 text-xs text-white/60 border-t border-white/10 pt-4">
                <span className="size-2 rounded-full bg-moroccan-mint-500" aria-hidden="true" />
                {t("contact.note")}
              </p>
            </aside>
          </div>
        </Container>
      </section>
    </>
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
    <div className="rounded-2xl bg-card border border-border p-6 shadow-card hover:border-moroccan-gold-500/40 hover:shadow-soft transition-all">
      <span className="inline-flex items-center justify-center size-11 rounded-xl bg-moroccan-gold-500/10 text-moroccan-gold-600 mb-4">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="font-display text-base font-bold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
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
    <li className="rounded-2xl border border-border bg-card p-5 shadow-card hover:border-moroccan-red-500/40 hover:shadow-soft transition-all">
      <Icon className="size-6 text-moroccan-red-500 mb-3" aria-hidden />
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </li>
  )
}

function StepCard({
  n,
  title,
  desc,
}: {
  n: number
  title: string
  desc: string
}) {
  return (
    <li className="relative rounded-2xl border border-border bg-card p-6 shadow-card">
      <span className="inline-flex items-center justify-center size-10 rounded-full bg-moroccan-gradient text-white font-display font-bold shadow-sm mb-4">
        {n}
      </span>
      <p className="font-display text-base font-bold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
    </li>
  )
}

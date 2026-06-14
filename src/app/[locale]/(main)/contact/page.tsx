import type { Metadata } from "next"
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ContactForm } from "@/components/contact/ContactForm"
import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { createClient } from "@/lib/supabase/server"
import { localeAlternates } from "@/lib/seo/alternates"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "contactPage" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localeAlternates(locale, `/contact`),
  }
}

function asString(raw: unknown, fallback = ""): string {
  if (typeof raw === "string") return raw
  return fallback
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("contactPage")

  // Pull the configurable contact details from site_settings.
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["contact_email", "contact_phone"])
  const map = new Map(
    ((rows ?? []) as Array<{ key: string; value: unknown }>).map((r) => [
      r.key,
      r.value,
    ]),
  )
  const email = asString(map.get("contact_email"), "contact@autobladi.ma")
  const phone = asString(map.get("contact_phone"), "")

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-moroccan-gradient text-white">
        <div
          className="absolute -end-24 -top-24 size-72 rounded-full bg-moroccan-gold-500/25 blur-3xl"
          aria-hidden="true"
        />
        <Container className="relative py-16 md:py-20">
          <div className="max-w-3xl space-y-4">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-moroccan-gold-500">
              <MessageCircle className="size-4" aria-hidden="true" />
              {t("hero.eyebrow")}
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-lg text-white/85 max-w-2xl">{t("hero.subtitle")}</p>
          </div>
        </Container>
      </section>

      {/* Form + info */}
      <section className="py-12 md:py-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            <ContactForm />

            <aside className="space-y-5">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
                <header>
                  <h2 className="font-display text-lg font-bold text-foreground">
                    {t("info.title")}
                  </h2>
                  <GoldAccent className="mt-2" />
                </header>

                <ul className="space-y-4 text-sm">
                  <InfoRow icon={Mail} label={t("info.emailLabel")}>
                    <a
                      href={`mailto:${email}`}
                      className="text-foreground hover:text-moroccan-red-500 transition-colors break-all"
                    >
                      {email}
                    </a>
                  </InfoRow>

                  {phone && (
                    <InfoRow icon={Phone} label={t("info.phoneLabel")}>
                      <a
                        href={`tel:${phone.replace(/\s/g, "")}`}
                        className="text-foreground hover:text-moroccan-red-500 transition-colors"
                        dir="ltr"
                      >
                        {phone}
                      </a>
                    </InfoRow>
                  )}

                  <InfoRow icon={Clock} label={t("info.hoursLabel")}>
                    <span className="text-foreground">{t("info.hoursValue")}</span>
                  </InfoRow>

                  <InfoRow icon={MapPin} label={t("info.addressLabel")}>
                    <span className="text-foreground">{t("info.addressValue")}</span>
                  </InfoRow>
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  )
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  label: string
  children: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex shrink-0 items-center justify-center size-9 rounded-full bg-moroccan-gold-500/15 text-moroccan-gold-700">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </li>
  )
}

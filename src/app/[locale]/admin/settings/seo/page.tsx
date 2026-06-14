import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { CheckCircle2, ExternalLink, FileCode2, Map, Rss, Zap } from "lucide-react"

import { SeoSettingsForm } from "@/components/admin/SeoSettingsForm"
import { createClient } from "@/lib/supabase/server"
import { getSiteVerification } from "@/lib/queries/home"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

export default async function AdminSeoSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.seoPage")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/connexion`)
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  if (profile?.account_type !== "admin") redirect(`/${locale}`)

  const verify = await getSiteVerification()
  const indexNowReady = Boolean(process.env.INDEXNOW_KEY)

  const resources = [
    {
      icon: Map,
      title: t("sitemapTitle"),
      desc: t("sitemapDesc"),
      href: `${SITE_URL}/sitemap.xml`,
      label: "/sitemap.xml",
    },
    {
      icon: FileCode2,
      title: t("robotsTitle"),
      desc: t("robotsDesc"),
      href: `${SITE_URL}/robots.txt`,
      label: "/robots.txt",
    },
    {
      icon: Rss,
      title: t("rssTitle"),
      desc: t("rssDesc"),
      href: `${SITE_URL}/feed.xml`,
      label: "/feed.xml",
    },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      <SeoSettingsForm
        initial={{
          google_site_verification: verify.google ?? "",
          bing_site_verification: verify.bing ?? "",
        }}
      />

      {/* External consoles */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">{t("consolesTitle")}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t("consolesHelp")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 hover:border-moroccan-gold-500/60 hover:bg-moroccan-gold-50/40 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">
              Google Search Console
            </span>
            <ExternalLink
              className="size-4 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
          </a>
          <a
            href="https://www.bing.com/webmasters"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 hover:border-moroccan-gold-500/60 hover:bg-moroccan-gold-50/40 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">
              Bing Webmaster Tools
            </span>
            <ExternalLink
              className="size-4 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
          </a>
        </div>
      </section>

      {/* IndexNow status */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-3">
        <div className="flex items-start gap-3">
          <Zap
            className="size-5 text-moroccan-gold-600 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground">{t("indexNowTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t("indexNowDesc")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {indexNowReady ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              {t("indexNowOn")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
              {t("indexNowOff")}
            </span>
          )}
          {indexNowReady && (
            <a
              href={`${SITE_URL}/indexnow.txt`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-moroccan-red-600 hover:underline"
            >
              /indexnow.txt
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </section>

      {/* Resource links */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => {
          const Icon = r.icon
          return (
            <a
              key={r.label}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-border bg-card p-5 shadow-card hover:border-moroccan-gold-500/60 transition-colors group"
            >
              <div className="flex items-center gap-2 text-foreground">
                <Icon
                  className="size-5 text-moroccan-red-600 shrink-0"
                  aria-hidden="true"
                />
                <span className="font-semibold">{r.title}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{r.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground group-hover:text-moroccan-red-600">
                {r.label}
                <ExternalLink className="size-3" aria-hidden="true" />
              </span>
            </a>
          )
        })}
      </section>
    </div>
  )
}
